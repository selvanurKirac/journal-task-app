import React from "react";
import { Link } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext"; // yolu kendi projene göre ayarla

// Rotalar: /login, /signup ve giriş yapınca gidilecek günlük sayfası (/journal)
// Farklıysa aşağıdaki sabitleri değiştir.
const ROUTES = { login: "/login", signup: "/register", app: "/journalapp" };

const brandGradient = "linear-gradient(45deg, #667eea, #764ba2)";
const pageGradient = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
const glass = {
  background: "rgba(255, 255, 255, 0.95)",
  backdropFilter: "blur(10px)",
};

const FEATURES = [
  {
    icon: "bi-pencil-square",
    title: "Günlüğünü yaz",
    text: "Her gün için ayrı bir sayfa. Gününü yaz, tarihi değiştirerek eski kayıtlarına dön.",
  },
  {
    icon: "bi-check2-square",
    title: "Görevlerini takip et",
    text: "Yapılacakları ekle, bitirdikçe işaretle ve günün ilerlemesini çubukta gör.",
  },
  {
    icon: "bi-emoji-smile",
    title: "Ruh halini ve havayı not et",
    text: "Günün nasıl geçtiğini tek seçimle kaydet, zamanla neyin sana iyi geldiğini fark et.",
  },
  {
    icon: "bi-shield-lock",
    title: "Sadece sana ait",
    text: "Kayıtların hesabına bağlı saklanır. Giriş yaptığın her cihazdan erişirsin.",
  },
];

const Home = () => {
  const { user, authLoading } = useUserAuth();

  return (
    <div className="min-vh-100" style={{ background: pageGradient }}>
      {/* Üst bar: marka solda, giriş / kayıt sağda */}
      <nav className="container py-3">
        <div
          className="d-flex align-items-center justify-content-between rounded-4 shadow-lg px-3 px-md-4 py-3"
          style={glass}
        >
          <Link
            to="/"
            className="d-flex align-items-center text-decoration-none fw-bold fs-5"
            style={{ color: "#4b3f8f" }}
          >
            <i
              className="bi bi-journal-bookmark me-2 fs-4"
              style={{ color: "#667eea" }}
            />
            Günlük & Görevlerim
          </Link>

          <div className="d-flex align-items-center gap-2">
            {authLoading ? null : user ? (
              <Link
                to={ROUTES.app}
                className="btn text-white border-0 px-4"
                style={{ background: brandGradient, fontWeight: 500 }}
              >
                Günlüğüme git
              </Link>
            ) : (
              <>
                <Link
                  to={ROUTES.login}
                  className="btn btn-outline-secondary border-0 px-3 fw-semibold"
                >
                  Giriş yap
                </Link>
                <Link
                  to={ROUTES.signup}
                  className="btn text-white border-0 px-4"
                  style={{ background: brandGradient, fontWeight: 500 }}
                >
                  Kayıt ol
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="container py-5">
        <div className="row align-items-center g-5">
          <div className="col-lg-6 text-white">
            <h1 className="display-4 fw-bold mb-3" style={{ lineHeight: 1.15 }}>
              Gününü yaz, görevlerini bitir, ilerlediğini gör.
            </h1>
            <p className="fs-5 mb-4 opacity-75" style={{ maxWidth: "34rem" }}>
              Tek bir yerde günlük tut ve yapılacaklar listeni yönet. Ruh halini
              ve günün havasını da ekle; hepsi tarihe göre saklanır.
            </p>
            {!user && !authLoading && (
              <div className="d-flex flex-wrap gap-3">
                <Link
                  to={ROUTES.signup}
                  className="btn btn-light btn-lg px-4 fw-semibold shadow"
                  style={{ color: "#4b3f8f" }}
                >
                  Ücretsiz kayıt ol
                </Link>
                <Link
                  to={ROUTES.login}
                  className="btn btn-outline-light btn-lg px-4 fw-semibold"
                >
                  Zaten hesabım var
                </Link>
              </div>
            )}
            {user && (
              <Link
                to={ROUTES.app}
                className="btn btn-light btn-lg px-4 fw-semibold shadow"
                style={{ color: "#4b3f8f" }}
              >
                Günlüğüme git
              </Link>
            )}
          </div>

          {/* Örnek günlük kartı */}
          <div className="col-lg-6">
            <div
              className="card border-0 shadow-lg rounded-4"
              style={glass}
              aria-hidden="true"
            >
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-semibold">Bugün</span>
                  <span className="fs-4">😊 ☀️</span>
                </div>
                <p className="text-muted mb-4" style={{ lineHeight: 1.6 }}>
                  Sabah yürüyüşüyle başladım, öğleden sonra projenin ilk
                  bölümünü bitirdim. Akşam kitap okumaya zaman kaldı.
                </p>
                {[
                  { t: "Yürüyüşe çık", d: true },
                  { t: "Proje taslağını bitir", d: true },
                  { t: "30 sayfa kitap oku", d: false },
                ].map((task) => (
                  <div
                    key={task.t}
                    className="d-flex align-items-center rounded-3 p-2 px-3 mb-2"
                    style={{
                      background: task.d
                        ? "rgba(40, 167, 69, 0.1)"
                        : "rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    <i
                      className={`bi me-3 ${
                        task.d
                          ? "bi-check-circle-fill text-success"
                          : "bi-circle text-secondary"
                      }`}
                    />
                    <span
                      className={
                        task.d ? "text-muted text-decoration-line-through" : ""
                      }
                    >
                      {task.t}
                    </span>
                  </div>
                ))}
                <div
                  className="progress mt-3"
                  style={{ height: 8, borderRadius: 10 }}
                >
                  <div
                    className="progress-bar"
                    style={{
                      width: "66%",
                      borderRadius: 10,
                      background: "linear-gradient(45deg, #28a745, #20c997)",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Özellikler */}
      <section className="container pb-5">
        <div className="row g-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="col-md-6 col-lg-3">
              <div
                className="card h-100 border-0 shadow rounded-4"
                style={glass}
              >
                <div className="card-body p-4">
                  <i
                    className={`bi ${f.icon} fs-2 mb-3 d-block`}
                    style={{ color: "#667eea" }}
                  />
                  <h2 className="h5 fw-bold mb-2">{f.title}</h2>
                  <p className="text-muted mb-0">{f.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Alt çağrı */}
      {!user && !authLoading && (
        <section className="container pb-5">
          <div className="rounded-4 shadow-lg text-center p-5" style={glass}>
            <h2 className="fw-bold mb-3">İlk günlük kaydını bugün yaz</h2>
            <p className="text-muted mb-4">Kayıt olmak bir dakikanı alır.</p>
            <Link
              to={ROUTES.signup}
              className="btn btn-lg text-white border-0 px-5"
              style={{ background: brandGradient, fontWeight: 500 }}
            >
              Kayıt ol
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
