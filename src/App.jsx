import { useState } from "react";
import "./App.css";
import nexusPayLogo from './assets/nexus-pay-logo.png';
import {
  auth,
  db,
  signInWithEmailAndPassword,
  signOut,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
  addDoc,
} from "./firebase";

function App() {
  const [stage, setStage] = useState("login");
  const [activeTab, setActiveTab] = useState("home");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [accNo, setAccNo] = useState("");
  const [balance, setBalance] = useState(0);
  const [uid, setUid] = useState("");
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [newBeneficiaryAcc, setNewBeneficiaryAcc] = useState("");
  const [newBeneficiaryName, setNewBeneficiaryName] = useState("");
  const [accNosList, setAccNosList] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [modalData, setModalData] = useState({ acc: "", name: "", amount: "" });
  
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [paymentPin, setPaymentPin] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  const handleLogin = async () => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const currentUID = res.user.uid;
      setUid(currentUID);
      const userRef = doc(db, "users", currentUID);
      const userSnap = await getDoc(userRef);
      const allUsersSnap = await getDocs(collection(db, "users"));
      const accList = allUsersSnap.docs.map(doc => doc.data().accno).filter(Boolean);
      setAccNosList(accList);

      if (!userSnap.exists() || !userSnap.data().pin) {
        setStage("info");
      } else {
        const data = userSnap.data();
        setName(data.name);
        setPhone(data.phone);
        setAccNo(data.accno);
        setBalance(data.balance || 0);
        const benSnap = await getDocs(collection(userRef, "beneficiaries"));
        const benList = benSnap.docs.map((d) => ({ acc: d.id, name: d.data().name || "" }));
        setBeneficiaries(benList);
        const txSnap = await getDocs(collection(userRef, "transactions"));
        const txList = txSnap.docs.map((d) => d.data());
        setTransactions(txList.sort((a, b) => new Date(b.time) - new Date(a.time)));
        setStage("dashboard");
      }
    } catch (err) {
      alert("Login Error: " + err.message);
    }
  };

  const handleInfoSubmit = async () => {
    if (!name || !phone || !pin || !confirmPin) return alert("Please fill in all fields.");
    if (pin.length !== 6) return alert("PIN must be exactly 6 digits.");
    if (pin !== confirmPin) return alert("PINs do not match. Please try again.");

    try {
      const generatedAccNo = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      setAccNo(generatedAccNo);
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, { name, phone, accno: generatedAccNo, balance: 1000, pin });
      setBalance(1000);
      setStage("dashboard");
      alert("Profile created successfully!");
    } catch (err) {
      alert("Profile creation failed: " + err.message);
    }
  };

  const handleOpenPaymentModal = (b) => {
    setModalData({ acc: b.acc, name: b.name, amount: "" });
  };

  const handlePaymentRequest = () => {
    const amount = parseFloat(modalData.amount);
    if (isNaN(amount) || amount <= 0) return alert("Please enter a valid amount.");
    if (amount > balance) return alert("Insufficient balance.");

    document.getElementById('closePaymentModalBtn').click();
    setShowPinModal(true);
  };

  const processPaymentWithPin = async () => {
    if (paymentPin.length !== 6) return alert("Please enter your 6-digit PIN.");

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      const storedPin = userSnap.data().pin;

      if (paymentPin !== storedPin) {
        return alert("Invalid PIN. Please try again.");
      }

      const amount = parseFloat(modalData.amount);
      const receiverQuery = await getDocs(collection(db, "users"));
      let receiverDoc = null;
      receiverQuery.forEach((d) => {
        if (d.data().accno === modalData.acc) receiverDoc = d;
      });
      if (!receiverDoc) return alert("Receiver not found!");

      const receiverUID = receiverDoc.id;
      const receiverData = receiverDoc.data();
      const senderRef = doc(db, "users", uid);
      const receiverRef = doc(db, "users", receiverUID);

      await setDoc(senderRef, { balance: balance - amount }, { merge: true });
      await setDoc(receiverRef, { balance: (receiverData.balance || 0) + amount }, { merge: true });

      const txTime = new Date().toISOString();
      const txObjSender = { type: "debit", amount, name: modalData.name, time: txTime, acc: modalData.acc };
      const txObjReceiver = { type: "credit", amount, name, time: txTime, acc: accNo };
      
      await addDoc(collection(senderRef, "transactions"), txObjSender);
      await addDoc(collection(receiverRef, "transactions"), txObjReceiver);

      setBalance(balance - amount);
      setTransactions(prev => [txObjSender, ...prev].sort((a, b) => new Date(b.time) - new Date(a.time)));
      
      setShowPinModal(false);
      setPaymentPin("");
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);

    } catch (err) { // ✅ FIXED: Added opening curly brace
      alert("Payment failed: " + err.message);
    }
  };
  
  const handleAddBeneficiary = async () => {
    if (!newBeneficiaryName || !newBeneficiaryAcc) return alert("Please fill both fields.");
    if (newBeneficiaryAcc === accNo) return alert("Can't add yourself as beneficiary.");
    if (!accNosList.includes(newBeneficiaryAcc)) return alert("Account number does not exist.");
    if (beneficiaries.find(b => b.acc === newBeneficiaryAcc)) return alert("Beneficiary already exists.");
    try {
      const benRef = doc(db, "users", uid, "beneficiaries", newBeneficiaryAcc);
      await setDoc(benRef, { name: newBeneficiaryName, addedAt: new Date().toISOString() });
      setBeneficiaries([...beneficiaries, { acc: newBeneficiaryAcc, name: newBeneficiaryName }]);
      setNewBeneficiaryAcc("");
      setNewBeneficiaryName("");
    } catch (err) {
      alert("Error adding beneficiary: " + err.message);
    }
  };

  const handleDeleteBeneficiary = async (acc) => {
    if (!window.confirm(`Are you sure you want to delete beneficiary ${acc}?`)) return;
    try {
      await deleteDoc(doc(db, "users", uid, "beneficiaries", acc));
      setBeneficiaries(beneficiaries.filter((b) => b.acc !== acc));
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };
  
  const handleLogout = async () => {
    await signOut(auth);
    setStage("login");
    setEmail(""); setPassword(""); setName(""); setPhone("");
    setAccNo(""); setBalance(0); setUid(""); setBeneficiaries([]);
    setNewBeneficiaryAcc(""); setNewBeneficiaryName(""); setTransactions([]);
    setPin(""); setConfirmPin("");
  };

  return (
    <div className="App">
      {stage === "login" && (
        <div className="auth-container">
          <div className="auth-card">
            <img src={nexusPayLogo} alt="Nexus Pay Logo" className="auth-logo" />
            <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleLogin}>Login</button>
          </div>
        </div>
      )}

      {stage === "info" && (
        <div className="auth-container">
          <div className="auth-card">
            <img src={nexusPayLogo} alt="Nexus Pay Logo" className="auth-logo" />
            <h3 className="auth-subtitle">Complete Profile</h3>
            <input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            <input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input type="password" maxLength="6" placeholder="Create 6-Digit PIN" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
            <input type="password" maxLength="6" placeholder="Confirm 6-Digit PIN" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} />
            <button onClick={handleInfoSubmit}>Create Profile</button>
          </div>
        </div>
      )}
      
      {stage === "dashboard" && (
        <>
          <nav className="navbar navbar-expand-lg navbar-dark">
            <div className="container-fluid">
              <a className="navbar-brand" href="#">
                <img src={nexusPayLogo} alt="Nexus Pay Logo" className="nav-logo" />
              </a>
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span className="navbar-toggler-icon"></span>
              </button>
              <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav ms-auto align-items-center">
                  <li className="nav-item">
                    <button className={`nav-link btn btn-link ${activeTab === "home" ? "active" : ""}`} onClick={() => setActiveTab("home")}>Home</button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link btn btn-link ${activeTab === "transactions" ? "active" : ""}`} onClick={() => setActiveTab("transactions")}>Transactions</button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link btn btn-link ${activeTab === "beneficiaries" ? "active" : ""}`} onClick={() => setActiveTab("beneficiaries")}>Beneficiaries</button>
                  </li>
                  <li className="nav-item">
                    <button className={`nav-link btn btn-link ${activeTab === "payment" ? "active" : ""}`} onClick={() => setActiveTab("payment")}>Payment</button>
                  </li>
                  <li className="nav-item">
                    <button className="nav-link btn logout-nav-btn" onClick={handleLogout}>Logout</button>
                  </li>
                </ul>
              </div>
            </div>
          </nav>

          <div className="dashboard">
            {activeTab === "home" && (
              <>
                <div className="card">
                  <h2>Welcome, {name}</h2>
                  <p>📱 Phone: {phone}</p>
                  <p>🏦 Account No: {accNo}</p>
                  <p>💰 Balance: ₹{balance}</p>
                </div>
                <div className="card">
                  <h3>Recent Transactions</h3>
                  <table className="tx-table">
                    <thead><tr><th>Name</th><th>Amount</th><th>Type</th><th>Date & Time</th></tr></thead>
                    <tbody>
                      {transactions.slice(0, 5).map((tx, i) => (
                        <tr key={i}>
                          <td>{tx.name || "N/A"}</td>
                          <td>₹{tx.amount}</td>
                          <td className={tx.type === 'debit' ? 'text-danger' : 'text-success'}>{tx.type}</td>
                          <td>{new Date(tx.time).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {transactions.length > 5 && (
                    <button className="view-more-btn" onClick={() => setActiveTab('transactions')}>
                      Click to view more
                    </button>
                  )}
                </div>
              </>
            )}

            {activeTab === "transactions" && (
              <div className="card">
                <h2>Your Transactions</h2>
                <table className="tx-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Account No</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => (
                      <tr key={i}>
                        <td>{tx.name || "N/A"}</td>
                        <td>{tx.acc || "N/A"}</td>
                        <td>₹{tx.amount}</td>
                        <td className={tx.type === 'debit' ? 'text-danger' : 'text-success'}>{tx.type}</td>
                        <td>{new Date(tx.time).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "beneficiaries" && (
              <>
                <div className="card">
                  <h3>Add Beneficiary</h3>
                  <input placeholder="Beneficiary Name" value={newBeneficiaryName} onChange={(e) => setNewBeneficiaryName(e.target.value)} />
                  <input placeholder="Beneficiary Account Number" value={newBeneficiaryAcc} onChange={(e) => setNewBeneficiaryAcc(e.target.value)} />
                  <button onClick={handleAddBeneficiary}>Add Beneficiary</button>
                </div>
                <div className="card">
                  <h3>Your Beneficiaries</h3>
                  {beneficiaries.length === 0 ? (<p>No beneficiaries added.</p>) : (
                    <ul className="beneficiary-list">
                      {beneficiaries.map((b, i) => (
                        <li key={i} className="beneficiary-item">
                          <span>👤 {b.name} - {b.acc}</span>
                          <button onClick={() => handleDeleteBeneficiary(b.acc)}>❌</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}

            {activeTab === "payment" && (
              <div className="card">
                <h2>Make Payment</h2>
                {beneficiaries.length === 0 ? (<p>Please add a beneficiary first.</p>) : (
                  <div className="row justify-content-center">
                    {beneficiaries.map((b, i) => (
                      <div className="col-md-auto mb-3" key={i}>
                        <div className="card p-3">
                          <h5>{b.name}</h5>
                          <p>{b.acc}</p>
                          <button className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#paymentModal" onClick={() => handleOpenPaymentModal(b)}>
                            Pay Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
      
      <div className="modal fade" id="paymentModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Make Payment</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="col-form-label">Name:</label>
                <input type="text" className="form-control" value={modalData.name} disabled />
              </div>
              <div className="mb-3">
                <label className="col-form-label">Account Number:</label>
                <input type="text" className="form-control" value={modalData.acc} disabled />
              </div>
              <div className="mb-3">
                <label className="col-form-label">Amount:</label>
                <input type="number" className="form-control" value={modalData.amount} onChange={(e) => setModalData({ ...modalData, amount: e.target.value })} autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" id="closePaymentModalBtn">Close</button>
              <button type="button" className="btn btn-primary" onClick={handlePaymentRequest}>Confirm Payment</button>
            </div>
          </div>
        </div>
      </div>

      {showPinModal && (
        <div className="modal-backdrop">
          <div className="otp-modal">
            <h4>Confirm Payment</h4>
            <p>Paying ₹{modalData.amount} to {modalData.name}</p>
            <input 
              type="password" 
              maxLength="6" 
              placeholder="Enter Your 6-Digit PIN"
              value={paymentPin}
              onChange={(e) => setPaymentPin(e.target.value.replace(/\D/g, ''))}
              className="otp-input"
              autoFocus
            />
            <button onClick={processPaymentWithPin}>Make Payment</button>
            <button className="btn-secondary" onClick={() => setShowPinModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="modal-backdrop">
          <div className="otp-modal">
            <h2>✅</h2>
            <h4>Payment Successful!</h4>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;