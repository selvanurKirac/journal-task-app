import JournalApp from "./components/JournalApp";
import { UserAuthContextProvider } from "./context/UserAuthContext";
import { Container, Row, Col } from "react-bootstrap";
import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <UserAuthContextProvider>
        <Container>
          <Row>
            <Col>
              <Routes>
                <Route path="/" element={<Home />} />

                <Route
                  path="/login"
                  element={
                    <PublicOnlyRoute>
                      <Login />
                    </PublicOnlyRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicOnlyRoute>
                      <Signup />
                    </PublicOnlyRoute>
                  }
                />

                <Route
                  path="/journalapp"
                  element={
                    <ProtectedRoute>
                      <JournalApp />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Col>
          </Row>
        </Container>
      </UserAuthContextProvider>
    </>
  );
}

export default App;
