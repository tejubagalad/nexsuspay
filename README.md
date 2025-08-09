# Nexus Pay 💸

![Nexus Pay Logo](./src/assets/1.png)

Nexus Pay is a web-based payment application that simulates core banking functionalities. It allows users to manage their accounts, add beneficiaries, and securely transfer funds to other users on the platform. The application is built with **React** and uses **Google Firebase** for its backend services, including authentication and the Firestore database.

---

## ✨ Key Features

- **Secure User Authentication**: Users can log in with their email and password using Firebase Authentication.
- **One-Time Profile Setup**: New users are guided through a simple profile creation process where they set up their name, phone number, and a secure 6-digit PIN.
- **Automatic Account Generation**: Upon first login and profile setup, each user is assigned a unique 10-digit account number and a starting balance of **₹1,000**.
- **Dashboard Overview**: A central home screen displays the user's account details, current balance, and a summary of recent transactions.
- **Transaction History**: A dedicated tab shows a complete, sorted list of all debit and credit transactions.
- **Beneficiary Management**: Users can add new payees by entering their name and account number. The system validates that the account number exists before adding. Users can also delete beneficiaries.
- **PIN-Protected Payments**: All fund transfers are secured. Users must enter their 6-digit PIN to authorize any payment, preventing unauthorized transactions.
- **Real-time Database**: Leverages Firebase Firestore to instantly update balances and transaction logs for both the sender and the receiver.

---

## ⚙️ Technology Stack

- **Frontend**: React.js
- **Backend & Database**: Google Firebase (Authentication & Cloud Firestore)
- **Styling**: CSS with Bootstrap for modals and navigation.

---

## 🚀 How It Works

1.  **Login**: An existing user logs in with their credentials. A new user can also log in with an email/password combination created in the Firebase console.
2.  **Profile Creation**: If it's the user's first time logging in (or they haven't set up their profile yet), they are redirected to a page to enter their name, phone number, and create a 6-digit PIN. This action generates their unique bank account number.
3.  **Dashboard**: Once logged in, the user has access to a dashboard with four main sections:
    - **Home**: A summary of their account.
    - **Transactions**: A detailed statement.
    - **Beneficiaries**: A list of saved payees.
    - **Payment**: The interface to start a new payment.
4.  **Making a Payment**:
    - The user navigates to the "Payment" tab and selects a beneficiary.
    - A modal appears where they can enter the amount to transfer.
    - After confirming the amount, a second modal prompts for their 6-digit PIN.
    - The app validates the PIN. If correct, the transaction is processed: the sender's balance is debited, the receiver's balance is credited, and transaction records are created for both users.

---

## 🛠️ Getting Started

To run this project locally, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/your-username/nexus-pay.git](https://github.com/your-username/nexus-pay.git)
    cd nexus-pay
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure Firebase:**

    - Make sure you have a `firebase.js` file in your `src` directory.
    - This file must export your Firebase configuration and initialized services. (The setup you provided earlier using environment variables is the correct approach for this).

4.  **Run the application:**
    ```bash
    npm start
    ```
    The app will be available at `http://localhost:3000`.

---

## 🧑‍🤝‍🧑 Test Users

You can use the following pre-registered user accounts to test the application. All users have already completed the profile setup and have a 6-digit PIN of **123456**.

| Email                    | Password     | PIN      |
| :----------------------- | :----------- | :------- |
| `bankuser1@nexuspay.com` | `1234567890` | `123456` |
| `bankuser2@nexuspay.com` | `1234567890` | `123456` |
| `bankuser3@nexuspay.com` | `1234567890` | `123456` |
| `bankuser4@nexuspay.com` | `1234567890` | `123456` |

**To test a transaction:**

1.  Log in as `bankuser1@nexuspay.com`.
2.  Go to the "Beneficiaries" tab and add `bankuser2@nexuspay.com` as a beneficiary (you will need their account number, which is visible on their "Home" screen).
3.  Go to the "Payment" tab, select the beneficiary, and transfer funds.
