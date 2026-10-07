import React, { useState, useEffect, useRef } from "react";
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useUserAuth } from "../context/UserAuthContext"; // yolu kendi projene göre ayarla
import { useNavigate } from "react-router-dom";
// Bootstrap'i buraya <link>/<script> olarak koyma (script React'te çalışmaz).
// main.jsx / index.js içinde şunları import et:
//   import "bootstrap/dist/css/bootstrap.min.css";
//   import "bootstrap-icons/font/bootstrap-icons.css";

const TZ = "Europe/Istanbul";

// "YYYY-MM-DD" — Türkiye saatine göre (toISOString UTC verdiği için gece 00:00-03:00 arası yanlış gün çıkıyordu)
const toDateKey = (date = new Date()) =>
  date.toLocaleDateString("en-CA", { timeZone: TZ });

const formatDateTime = (value) =>
  new Date(value).toLocaleString("tr-TR", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const EMPTY_ENTRY = {
  journal: "",
  tasks: [],
  mood: "normal",
  weather: "sunny",
};

const MOODS = {
  great: { emoji: "😄", label: "Harika" },
  good: { emoji: "😊", label: "İyi" },
  normal: { emoji: "😐", label: "Normal" },
  bad: { emoji: "😔", label: "Kötü" },
  terrible: { emoji: "😢", label: "Berbat" },
};

const WEATHER = {
  sunny: { emoji: "☀️", label: "Güneşli" },
  cloudy: { emoji: "☁️", label: "Bulutlu" },
  rainy: { emoji: "🌧️", label: "Yağmurlu" },
  snowy: { emoji: "❄️", label: "Karlı" },
  stormy: { emoji: "⛈️", label: "Fırtınalı" },
};

const glass = {
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(10px)",
};
const brandGradient = "linear-gradient(45deg, #667eea, #764ba2)";
const successGradient = "linear-gradient(45deg, #28a745, #20c997)";

const JournalApp = () => {
  const { user, logOut } = useUserAuth();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState(toDateKey());
  const [entries, setEntries] = useState({});
  const [entriesLoaded, setEntriesLoaded] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(EMPTY_ENTRY);
  const [newTask, setNewTask] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("journal");
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(""); // "", saving, saved, error
  const saveTimer = useRef(null);

  // ---- Firestore referansları ----
  const entriesCollection = () =>
    collection(db, "users", user.uid, "journal-entries");
  const entryDoc = (date) =>
    doc(db, "users", user.uid, "journal-entries", date);

  // ---- Tüm kayıtları bir kez yükle ----
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        // orderBy("date") kullanmıyoruz: "date" alanı olmayan dökümanları sessizce eler.
        // Doküman id'si zaten tarih; ihtiyaç olursa istemci tarafında sıralanır.
        const snapshot = await getDocs(entriesCollection());
        if (cancelled) return;

        const loaded = {};
        snapshot.forEach((d) => {
          loaded[d.id] = d.data();
        });
        setEntries(loaded);
        setEntriesLoaded(true);
      } catch (error) {
        console.error("Kayıtlar yüklenemedi:", error);
        if (!cancelled) setSaveStatus("error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // ---- Seçili tarih değişince (veya ilk yükleme bitince) formu doldur ----
  // `entries` bağımlılık DEĞİL: kaydetme sonrası yazdığın metin sıfırlanmasın.
  useEffect(() => {
    if (!entriesLoaded) return;
    setCurrentEntry(entries[selectedDate] || EMPTY_ENTRY);
    setIsEditing(false);
    setSaveStatus("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, entriesLoaded]);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  // ---- Kaydet ----
  const saveEntry = async () => {
    try {
      setSaveStatus("saving");

      const entryData = {
        ...currentEntry,
        date: selectedDate,
        userId: user.uid,
        lastModified: new Date().toISOString(),
      };

      await setDoc(entryDoc(selectedDate), entryData);

      setEntries((prev) => ({ ...prev, [selectedDate]: entryData }));
      setCurrentEntry(entryData);
      setIsEditing(false);
      setSaveStatus("saved");

      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => setSaveStatus(""), 2000);
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      setSaveStatus("error");
    }
  };

  const handleLogout = async () => {
    if (
      isEditing &&
      !window.confirm(
        "Kaydedilmemiş değişiklikler var. Yine de çıkış yapmak istiyor musun?",
      )
    ) {
      return;
    }
    try {
      await logOut();
      navigate("/"); // çıkıştan sonra ana sayfaya git
    } catch (error) {
      console.error("Çıkış hatası:", error);
    }
  };

  // ---- Form yardımcıları ----
  const updateEntry = (patch) => {
    setCurrentEntry((prev) => ({ ...prev, ...patch }));
    setIsEditing(true);
    if (saveStatus === "saved" || saveStatus === "error") setSaveStatus("");
  };

  const handleDateChange = (e) => {
    const next = e.target.value;
    if (!next || next === selectedDate) return;
    if (
      isEditing &&
      !window.confirm(
        "Kaydedilmemiş değişiklikler var. Yine de tarihi değiştirmek istiyor musun?",
      )
    ) {
      return;
    }
    setSelectedDate(next);
  };

  const addTask = () => {
    const text = newTask.trim();
    if (!text) return;
    updateEntry({
      tasks: [
        ...currentEntry.tasks,
        {
          id: Date.now(),
          text,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    });
    setNewTask("");
  };

  const toggleTask = (taskId) =>
    updateEntry({
      tasks: currentEntry.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed } : t,
      ),
    });

  const deleteTask = (taskId) =>
    updateEntry({ tasks: currentEntry.tasks.filter((t) => t.id !== taskId) });

  // ---- Kaydet butonu görünümü ----
  const saveButton = {
    saving: {
      text: "Kaydediliyor...",
      cls: "btn-secondary",
      style: { cursor: "not-allowed" },
    },
    saved: {
      text: "Kaydedildi",
      cls: "btn-success",
      style: { background: successGradient },
    },
    error: {
      text: "Tekrar Dene",
      cls: "btn-danger",
      style: { background: "linear-gradient(45deg, #dc3545, #fd7e14)" },
    },
    "": {
      text: "Kaydet",
      cls: "btn-success",
      style: { background: successGradient, fontWeight: 500 },
    },
  }[saveStatus];

  const saveIcon =
    saveStatus === "saving" ? (
      <span className="spinner-border spinner-border-sm me-2" role="status" />
    ) : (
      <i
        className={`bi me-2 ${
          saveStatus === "saved"
            ? "bi-check-circle"
            : saveStatus === "error"
              ? "bi-exclamation-triangle"
              : "bi-save"
        }`}
      />
    );

  const completedCount = currentEntry.tasks.filter((t) => t.completed).length;
  const taskCount = currentEntry.tasks.length;

  const tabButton = (id, icon, label) => (
    <li className="nav-item" role="presentation">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === id}
        className={`nav-link border-0 px-4 py-3 fw-semibold ${
          activeTab === id ? "active text-white" : "text-muted"
        }`}
        style={
          activeTab === id
            ? { background: brandGradient, borderRadius: "12px 12px 0 0" }
            : undefined
        }
        onClick={() => setActiveTab(id)}
      >
        <i className={`bi ${icon} me-2`} />
        {label}
      </button>
    </li>
  );

  if (!user) return null; // yönlendirme ProtectedRoute'ta yapılmalı

  return (
    <div
      className="min-vh-100"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div className="container py-5">
        {loading && (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 9999 }}
          >
            <div className="card p-4 text-center border-0" style={glass}>
              <div className="spinner-border text-primary mb-3" role="status" />
              <div>Yükleniyor...</div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="card shadow-lg mb-4 border-0" style={glass}>
          <div className="card-body p-4">
            <div className="row align-items-center">
              <div className="col-lg-6 col-md-12 mb-3 mb-lg-0">
                <h1
                  className="card-title mb-0 d-flex align-items-center"
                  style={{
                    background: brandGradient,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontSize: "2.5rem",
                    fontWeight: 700,
                  }}
                >
                  <i
                    className="bi bi-journal-bookmark me-3 fs-1"
                    style={{ color: "#667eea", WebkitTextFillColor: "#667eea" }}
                  />
                  Günlük & Görev Yöneticim
                </h1>
                <div className="text-muted small mt-2">
                  <i className="bi bi-person-circle me-1" />
                  {user.email}
                </div>
              </div>

              <div className="col-lg-6 col-md-12">
                <div className="d-flex justify-content-lg-end justify-content-start align-items-center gap-3 flex-wrap">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-calendar3 me-2 text-muted" />
                    <input
                      type="date"
                      aria-label="Tarih seç"
                      value={selectedDate}
                      onChange={handleDateChange}
                      className="form-control shadow-sm border-0"
                      style={{
                        width: "160px",
                        background: "rgba(255,255,255,0.9)",
                      }}
                    />
                  </div>
                  {(isEditing ||
                    saveStatus === "saved" ||
                    saveStatus === "error") && (
                    <button
                      onClick={saveEntry}
                      disabled={saveStatus === "saving"}
                      className={`btn shadow-sm d-flex align-items-center border-0 ${saveButton.cls}`}
                      style={saveButton.style}
                    >
                      {saveIcon}
                      {saveButton.text}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn btn-outline-danger shadow-sm d-flex align-items-center"
                  >
                    <i className="bi bi-box-arrow-right me-2" />
                    Çıkış Yap
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card shadow-lg border-0" style={glass}>
          <div className="card-header border-0 bg-transparent">
            <ul className="nav nav-tabs border-0" role="tablist">
              {tabButton("journal", "bi-pencil-square", "Günlük")}
              {tabButton("tasks", "bi-check2-square", "Görevler")}
            </ul>
          </div>

          <div className="card-body p-4">
            {activeTab === "journal" && (
              <div>
                <div className="row mb-4">
                  <div className="col-md-6 mb-3 mb-md-0">
                    <label htmlFor="mood" className="form-label fw-semibold">
                      <i className="bi bi-emoji-smile me-2" />
                      Ruh Hali
                    </label>
                    <select
                      id="mood"
                      value={currentEntry.mood}
                      onChange={(e) => updateEntry({ mood: e.target.value })}
                      className="form-select shadow-sm border-0"
                    >
                      {Object.entries(MOODS).map(([key, m]) => (
                        <option key={key} value={key}>
                          {m.emoji} {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="weather" className="form-label fw-semibold">
                      <i className="bi bi-cloud-sun me-2" />
                      Hava Durumu
                    </label>
                    <select
                      id="weather"
                      value={currentEntry.weather}
                      onChange={(e) => updateEntry({ weather: e.target.value })}
                      className="form-select shadow-sm border-0"
                    >
                      {Object.entries(WEATHER).map(([key, w]) => (
                        <option key={key} value={key}>
                          {w.emoji} {w.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="journal" className="form-label fw-semibold">
                    <i className="bi bi-journal-text me-2" />
                    Günlük Yazısı (
                    {new Date(`${selectedDate}T00:00:00`).toLocaleDateString(
                      "tr-TR",
                    )}
                    )
                  </label>
                  <textarea
                    id="journal"
                    value={currentEntry.journal}
                    onChange={(e) => updateEntry({ journal: e.target.value })}
                    placeholder="Bugün nasıl geçti? Neler yaşadın, neler öğrendin?"
                    className="form-control shadow-sm border-0"
                    rows={12}
                    style={{
                      resize: "vertical",
                      fontSize: "1.1rem",
                      lineHeight: 1.6,
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === "tasks" && (
              <div>
                <div className="input-group mb-4 shadow-sm">
                  <span
                    className="input-group-text border-0 text-white"
                    style={{ background: brandGradient }}
                  >
                    <i className="bi bi-plus-circle" />
                  </span>
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                    placeholder="Yeni görev ekle..."
                    aria-label="Yeni görev"
                    className="form-control border-0"
                    style={{ fontSize: "1.1rem" }}
                  />
                  <button
                    onClick={addTask}
                    type="button"
                    className="btn border-0 text-white"
                    style={{ background: successGradient, fontWeight: 500 }}
                  >
                    <i className="bi bi-plus-lg me-1" />
                    Ekle
                  </button>
                </div>

                <div className="mb-4">
                  {taskCount === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <i className="bi bi-target display-1 opacity-25" />
                      <p className="mt-3 mb-0">Henüz görev eklenmemiş</p>
                    </div>
                  ) : (
                    <div className="list-group shadow-sm">
                      {currentEntry.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="list-group-item d-flex align-items-center border-0 mb-2"
                          style={{
                            background: task.completed
                              ? "linear-gradient(135deg, rgba(40,167,69,0.1), rgba(32,201,151,0.1))"
                              : "rgba(255,255,255,0.8)",
                            borderRadius: "12px",
                            padding: "1rem",
                          }}
                        >
                          <button
                            onClick={() => toggleTask(task.id)}
                            aria-label={
                              task.completed
                                ? "Tamamlandı işaretini kaldır"
                                : "Tamamlandı olarak işaretle"
                            }
                            className={`btn btn-sm me-3 ${
                              task.completed
                                ? "btn-success"
                                : "btn-outline-secondary"
                            }`}
                            style={{ width: 32, height: 32 }}
                          >
                            <i
                              className={`bi ${task.completed ? "bi-check-lg" : "bi-circle"}`}
                            />
                          </button>
                          <span
                            className={`flex-grow-1 ${
                              task.completed
                                ? "text-muted text-decoration-line-through"
                                : ""
                            }`}
                          >
                            {task.text}
                          </span>
                          <button
                            onClick={() => deleteTask(task.id)}
                            aria-label="Görevi sil"
                            className="btn btn-sm btn-outline-danger ms-2"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {taskCount > 0 && (
                  <div
                    className="card border-0"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))",
                      borderRadius: "12px",
                    }}
                  >
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between text-muted small mb-2 flex-wrap">
                        <span>Toplam: {taskCount} görev</span>
                        <span>Tamamlanan: {completedCount}</span>
                        <span>Kalan: {taskCount - completedCount}</span>
                      </div>
                      <div
                        className="progress shadow-sm"
                        style={{ height: 8, borderRadius: 10 }}
                      >
                        <div
                          className="progress-bar"
                          role="progressbar"
                          aria-valuenow={completedCount}
                          aria-valuemin={0}
                          aria-valuemax={taskCount}
                          style={{
                            background: successGradient,
                            borderRadius: 10,
                            width: `${(completedCount / taskCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="card shadow-lg mt-4 border-0" style={glass}>
          <div className="card-body text-center py-3">
            <small className="text-muted fw-medium">
              {MOODS[currentEntry.mood]?.emoji}{" "}
              {WEATHER[currentEntry.weather]?.emoji}
              {" | "}
              {currentEntry.lastModified
                ? `Son kayıt: ${formatDateTime(currentEntry.lastModified)}`
                : "Bu gün için henüz kayıt yok"}
              {saveStatus === "saved" && (
                <span className="text-success ms-2">• Kaydedildi</span>
              )}
              {saveStatus === "error" && (
                <span className="text-danger ms-2">• Kaydetme hatası</span>
              )}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalApp;
