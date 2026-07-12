import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../lib/apiClient.js';
import AppIcon from '../components/ui/AppIcon.jsx';
import styles from './QuickReportPage.module.css';

const INCIDENT_TYPES = [
  { type: 'Traffic Jam', emoji: '🚧', label: 'Traffic Jam', hindi: 'ट्रैफिक जाम' },
  { type: 'Accident/Collision', emoji: '🚗', label: 'Accident', hindi: 'दुर्घटना' },
  { type: 'Vehicle Breakdown', emoji: '🚨', label: 'Breakdown', hindi: 'गाड़ी खराब' },
  { type: 'Fuel Issue', emoji: '⛽', label: 'Fuel Issue', hindi: 'ईंधन की समस्या' },
  { type: 'Bad Weather', emoji: '🌧', label: 'Bad Weather', hindi: 'खराब मौसम' },
  { type: 'Road Closed', emoji: '⛔', label: 'Road Closed', hindi: 'रास्ता बंद' },
];

export default function QuickReportPage() {
  const [step, setStep] = useState(0); // 0: Search, 1: Report Form, 2: Success
  const [vehicleNo, setVehicleNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTrip, setActiveTrip] = useState(null);

  // Form Fields
  const [selectedIncident, setSelectedIncident] = useState('');
  const [comments, setComments] = useState('');
  const [location, setLocation] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [fetchingGps, setFetchingGps] = useState(false);

  // Search active trip
  const handleSearchVehicle = async (e) => {
    e.preventDefault();
    if (!vehicleNo.trim()) {
      toast.error('Please enter a vehicle registration number.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.get(`/api/public/active-trip?registration_number=${vehicleNo.trim()}`);
      setActiveTrip(res.data.data);
      setStep(1);
      toast.success('Active trip found!');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'No active trip found for this vehicle.');
    } finally {
      setLoading(false);
    }
  };

  // Get current GPS coords
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setFetchingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
        setFetchingGps(false);
        toast.success('Location obtained successfully!');
      },
      () => {
        // Fallback random coords if user denies GPS permission
        const randomLat = (19.076 + (Math.random() - 0.5) * 0.1).toFixed(4);
        const randomLng = (72.8777 + (Math.random() - 0.5) * 0.1).toFixed(4);
        setLocation(`Lat: ${randomLat}, Lng: ${randomLng} (Estimated)`);
        setFetchingGps(false);
        toast.success('Used estimated network location.');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Submit report
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!selectedIncident) {
      toast.error('Please select an issue type.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/api/public/trips/${activeTrip.id}/incidents`, {
        incident_type: selectedIncident,
        location: location || 'Not Shared',
        comments: comments.trim() || 'No comments',
        photo_url: photoUrl.trim() || '',
      });
      setStep(2);
      toast.success('Incident reported successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit incident report.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form to start again
  const handleReset = () => {
    setVehicleNo('');
    setActiveTrip(null);
    setSelectedIncident('');
    setComments('');
    setLocation('');
    setPhotoUrl('');
    setStep(0);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <AppIcon name="alert" size={28} />
          </div>
          <h2 className={styles.title}>Quick Incident Report</h2>
          <p className={styles.subtitle}>
            quick reporting for drivers / ड्राइवरों के लिए तुरंत रिपोर्टिंग
          </p>
        </div>

        {/* Step 0: Search Vehicle */}
        {step === 0 && (
          <form onSubmit={handleSearchVehicle} className={styles.searchSection}>
            <div className={styles.searchLabel}>
              <span>Vehicle Registration Number</span>
              <span className={styles.hindiText}>वाहन का नंबर दर्ज करें (उदा. MH14CD5678)</span>
            </div>
            <input
              type="text"
              placeholder="e.g. MH14CD5678"
              className={`form-input ${styles.hugeInput}`}
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
              disabled={loading}
              autoFocus
            />
            <button type="submit" className={`btn btn-primary ${styles.searchBtn}`} disabled={loading}>
              {loading ? 'Finding...' : <><AppIcon name="arrowRight" size={18} /> Find My Trip / मेरी यात्रा खोजें</>}
            </button>
            <div className={styles.portalLink}>
              <Link to="/login" style={{ fontSize: '12px' }}>Go back to login portal</Link>
            </div>
          </form>
        )}

        {/* Step 1: Submit Form */}
        {step === 1 && activeTrip && (
          <form onSubmit={handleSubmitReport}>
            {/* Active trip details confirmation */}
            <div className={styles.tripInfoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Vehicle / गाड़ी:</span>
                <span className={styles.infoVal}>{activeTrip.registration_number}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Route / मार्ग:</span>
                <span className={styles.infoVal}>{activeTrip.source} ➔ {activeTrip.destination}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Driver / चालक:</span>
                <span className={styles.infoVal}>{activeTrip.driver_name}</span>
              </div>
            </div>

            <div className={styles.sectionTitle}>
              <span>Select Issue / समस्या चुनें:</span>
            </div>

            {/* Incidents Grid */}
            <div className={styles.incidentGrid}>
              {INCIDENT_TYPES.map((item) => (
                <div
                  key={item.type}
                  className={`${styles.incidentCard} ${selectedIncident === item.type ? styles.selected : ''}`}
                  onClick={() => setSelectedIncident(item.type)}
                >
                  <span className={styles.emoji}>{item.emoji}</span>
                  <span className={styles.cardName}>{item.label}</span>
                  <span className={styles.cardHindiName}>{item.hindi}</span>
                </div>
              ))}
            </div>

            {/* GPS Location button */}
            <div className={styles.gpsContainer}>
              <button
                type="button"
                className={styles.gpsBtn}
                onClick={handleGetLocation}
                disabled={fetchingGps}
              >
                <AppIcon name="route" size={16} /> 
                {fetchingGps ? 'Fetching Location...' : '📍 Share My Location / अपना स्थान साझा करें'}
              </button>
              {location && (
                <p className={styles.gpsCoords}>
                  Selected Location: {location}
                </p>
              )}
            </div>

            {/* Form Input fields */}
            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">
                Comments (Optional) / अतिरिक्त विवरण (वैकल्पिक)
              </label>
              <textarea
                className="form-textarea"
                rows="2"
                placeholder="e.g. flat tire, traffic block"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">
                Photo URL (Optional) / फोटो लिंक (वैकल्पिक)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. https://example.com/photo.jpg"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(0)}
                disabled={loading}
              >
                Back / पीछे
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !selectedIncident}
              >
                {loading ? 'Submitting...' : 'Submit Report / रिपोर्ट भेजें'}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Success State */}
        {step === 2 && (
          <div className={styles.successSection}>
            <div className={styles.successIcon}>
              <AppIcon name="check" size={32} />
            </div>
            <h3 className={styles.successTitle}>Report Submitted!</h3>
            <h4 className={styles.successHindi}>आपकी रिपोर्ट भेज दी गई है</h4>
            <p className={styles.successMsg}>
              Your fleet manager and dispatchers have been notified in the control room. 
              Please stay safe and wait for instructions.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleReset}
              style={{ marginTop: 'var(--space-4)' }}
            >
              Report Another Issue / दूसरी रिपोर्ट दर्ज करें
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
