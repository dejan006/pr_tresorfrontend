import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { postUser } from "../../comunication/FetchUser";
import zxcvbn from 'zxcvbn';
import ReCAPTCHA from 'react-google-recaptcha';

function RegisterUser({ loginValues, setLoginValues }) {
  const navigate = useNavigate();
  const recaptchaRef = useRef();

  const initialState = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordConfirmation: "",
    captcha: ""
  };

  const [credentials, setCredentials] = useState(initialState);
  const [errorMessage, setErrorMessage] = useState('');

  const [passwordScore, setPasswordScore] = useState(null);
  const [passwordFeedback, setPasswordFeedback] = useState('');

  const [captchaToken, setCaptchaToken] = useState('');

  const handlePasswordChange = (e) => {
    const pw = e.target.value;
    setCredentials(prev => ({ ...prev, password: pw }));

    if (pw.length > 0) {
      const result = zxcvbn(pw);
      setPasswordScore(result.score);

      const feedbackText = result.feedback.warning
        ? result.feedback.warning
        : result.feedback.suggestions.join(' ');
      setPasswordFeedback(feedbackText);
    } else {
      setPasswordScore(null);
      setPasswordFeedback('');
    }
  };

  const mapScoreToText = (score) => {
    switch (score) {
      case 0:
      case 1:
        return 'Schwach';
      case 2:
        return 'Mittel';
      case 3:
      case 4:
        return 'Stark';
      default:
        return '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (credentials.password !== credentials.passwordConfirmation) {
      setErrorMessage('Password und Bestätigung stimmen nicht überein.');
      return;
    }

    if (passwordScore < 2) {
      setErrorMessage('Bitte wähle ein stärkeres Passwort (mindestens "Mittel").');
      return;
    }

    if (!captchaToken) {
      setErrorMessage('Bitte bestätige, dass du kein Roboter bist.');
      return;
    }

    try {
      await postUser(credentials);

      setLoginValues({
        userName: credentials.email,
        password: credentials.password
      });

      setCredentials(initialState);
      setPasswordScore(null);
      setPasswordFeedback('');
      setCaptchaToken('');
      recaptchaRef.current.reset(); // reCAPTCHA zurücksetzen
      navigate('/');
    } catch (error) {
      console.error('Fehler beim Senden an den Server:', error.message);
      setErrorMessage(error.message);
    }
  };

  return (
    <div>
      <h2>Register user</h2>
      <form onSubmit={handleSubmit}>
        <section>
          <aside>
            <div>
              <label>Firstname:</label>
              <input
                type="text"
                value={credentials.firstName}
                onChange={(e) =>
                  setCredentials(prev => ({ ...prev, firstName: e.target.value }))
                }
                required
                placeholder="Please enter your firstname *"
              />
            </div>
            <div>
              <label>Lastname:</label>
              <input
                type="text"
                value={credentials.lastName}
                onChange={(e) =>
                  setCredentials(prev => ({ ...prev, lastName: e.target.value }))
                }
                required
                placeholder="Please enter your lastname *"
              />
            </div>
            <div>
              <label>Email:</label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials(prev => ({ ...prev, email: e.target.value }))
                }
                required
                placeholder="Please enter your email *"
              />
            </div>
          </aside>
          <aside>
            <div>
              <label>Password:</label>
              <input
                type="password"
                value={credentials.password}
                onChange={handlePasswordChange}
                required
                placeholder="Please enter your pwd *"
              />
            </div>
            <div>
              <label>Password confirmation:</label>
              <input
                type="password"
                value={credentials.passwordConfirmation}
                onChange={(e) =>
                  setCredentials(prev => ({ ...prev, passwordConfirmation: e.target.value }))
                }
                required
                placeholder="Please confirm your pwd *"
              />
            </div>
          </aside>
        </section>

        {passwordScore !== null && (
          <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
            <p>
              Stärke: <strong>{mapScoreToText(passwordScore)}</strong>
            </p>
            {passwordFeedback && (
              <p style={{ fontSize: '0.9rem', color: '#555' }}>
                {passwordFeedback}
              </p>
            )}
          </div>
        )}

        <div style={{ marginBottom: '1rem' }}>
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey="6LfIJV8rAAAAADTXLM7IJm0tEWqNF32l5AMWVE6P" // Webiste Key
            onChange={(token) => {
              setCaptchaToken(token);
              setCredentials(prev => ({ ...prev, captcha: token }));
            }}
          />
        </div>

        <button type="submit" disabled={passwordScore < 2}>
          Register
        </button>

        {errorMessage && (
          <p style={{ color: 'red', marginTop: '1rem' }}>
            {errorMessage}
          </p>
        )}
      </form>
    </div>
  );
}

export default RegisterUser;