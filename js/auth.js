// ================================
// PriceNazar - Supabase Authentication
// ================================

const SUPABASE_URL = "https://fpkkyppdhkngkktkrbji.supabase.co";

// Supabase PUBLISHABLE KEY
// Secret / Service key बिल्कुल नहीं डालना है.
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ib6fxqUCmPPGcJZE0Yqo3A_9Y8pUSXM";

let supabaseClient = null;

let authMode = "login";


// ================================
// INIT AUTH
// ================================

async function initAuth() {

    const { createClient } =
        await import(
            "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
        );

    supabaseClient = createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    createAuthModal();

    setupAuthButtons();

    updateAuthUI();

    // Auth state listener
    supabaseClient.auth.onAuthStateChange(
        async (event, session) => {

            updateAuthUI();

            // Password recovery link से वापस आने पर
            if (event === "PASSWORD_RECOVERY") {

                authMode = "recovery";

                showRecoveryMode();

                openAuthModal();
            }
        }
    );

    // अगर page password recovery के बाद खुला है
    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (session) {

        // Supabase recovery session को handle करेगा
    }
}


// ================================
// AUTH MODAL
// ================================

function createAuthModal() {

    if (document.getElementById("authModal")) return;

    const modal = document.createElement("div");

    modal.id = "authModal";

    modal.innerHTML = `
        <div class="auth-overlay">

            <div class="auth-box">

                <button
                    id="authCloseBtn"
                    class="auth-close"
                    type="button"
                >
                    ×
                </button>

                <h2 id="authTitle">Login</h2>

                <p id="authSubtitle">
                    Login to your PriceNazar account
                </p>

                <form id="authForm">

                    <input
                        type="email"
                        id="authEmail"
                        placeholder="Email address"
                        autocomplete="email"
                        required
                    >

                    <input
                        type="password"
                        id="authPassword"
                        placeholder="Password"
                        autocomplete="current-password"
                        minlength="6"
                        required
                    >

                    <button
                        type="submit"
                        class="primary-btn auth-submit"
                    >
                        Login
                    </button>

                </form>

                <button
                    id="forgotPasswordBtn"
                    type="button"
                    class="forgot-password-btn"
                >
                    Forgot Password?
                </button>

                <p
                    id="authMessage"
                    class="auth-message"
                ></p>

                <div class="auth-switch">

                    <span id="authSwitchText">
                        Don't have an account?
                    </span>

                    <button
                        id="authSwitchBtn"
                        type="button"
                    >
                        Sign Up
                    </button>

                </div>

            </div>

        </div>
    `;

    document.body.appendChild(modal);


    // Close
    document
        .getElementById("authCloseBtn")
        .addEventListener(
            "click",
            closeAuthModal
        );


    // Login / Signup / Recovery form
    document
        .getElementById("authForm")
        .addEventListener(
            "submit",
            handleAuth
        );


    // Login <-> Signup
    document
        .getElementById("authSwitchBtn")
        .addEventListener(
            "click",
            toggleAuthMode
        );


    // Forgot password
    document
        .getElementById("forgotPasswordBtn")
        .addEventListener(
            "click",
            showForgotPassword
        );
}


// ================================
// LOGIN / SIGNUP SWITCH
// ================================

function toggleAuthMode() {

    if (authMode === "recovery") {
        authMode = "login";
    } else {

        authMode =
            authMode === "login"
                ? "signup"
                : "login";
    }

    updateAuthModeUI();
}


// ================================
// UPDATE AUTH UI
// ================================

function updateAuthModeUI() {

    const title =
        document.getElementById("authTitle");

    const subtitle =
        document.getElementById("authSubtitle");

    const submit =
        document.querySelector(".auth-submit");

    const switchText =
        document.getElementById("authSwitchText");

    const switchBtn =
        document.getElementById("authSwitchBtn");

    const forgotBtn =
        document.getElementById("forgotPasswordBtn");

    const password =
        document.getElementById("authPassword");

    const email =
        document.getElementById("authEmail");

    const message =
        document.getElementById("authMessage");


    if (
        !title ||
        !subtitle ||
        !submit ||
        !switchText ||
        !switchBtn ||
        !message
    ) {
        return;
    }


    message.textContent = "";


    // ================================
    // RECOVERY MODE
    // ================================

    if (authMode === "recovery") {

        title.textContent =
            "Set New Password";

        subtitle.textContent =
            "Create a new password for your PriceNazar account";

        submit.textContent =
            "Update Password";

        switchText.textContent =
            "Remembered your password?";

        switchBtn.textContent =
            "Login";

        if (forgotBtn) {
            forgotBtn.style.display = "none";
        }

        if (email) {
            email.style.display = "none";
            email.required = false;
        }

        if (password) {
            password.placeholder =
                "New password";

            password.autocomplete =
                "new-password";

            password.required = true;
        }

        return;
    }


    // ================================
    // SIGNUP MODE
    // ================================

    if (authMode === "signup") {

        title.textContent =
            "Create Account";

        subtitle.textContent =
            "Create your PriceNazar account";

        submit.textContent =
            "Sign Up";

        switchText.textContent =
            "Already have an account?";

        switchBtn.textContent =
            "Login";

        if (forgotBtn) {
            forgotBtn.style.display = "block";
        }

        if (email) {
            email.style.display = "block";
            email.required = true;
        }

        if (password) {
            password.style.display = "block";
            password.required = true;
            password.placeholder = "Password";
            password.autocomplete = "new-password";
        }

        return;
    }


    // ================================
    // LOGIN MODE
    // ================================

    title.textContent =
        "Login";

    subtitle.textContent =
        "Login to your PriceNazar account";

    submit.textContent =
        "Login";

    switchText.textContent =
        "Don't have an account?";

    switchBtn.textContent =
        "Sign Up";

    if (forgotBtn) {
        forgotBtn.style.display = "block";
    }

    if (email) {
        email.style.display = "block";
        email.required = true;
    }

    if (password) {
        password.style.display = "block";
        password.required = true;
        password.placeholder = "Password";
        password.autocomplete = "current-password";
    }
}


// ================================
// SHOW RECOVERY MODE
// ================================

function showRecoveryMode() {

    authMode = "recovery";

    updateAuthModeUI();

    const modal =
        document.getElementById("authModal");

    if (modal) {
        modal.classList.add("active");
    }
}


// ================================
// HANDLE LOGIN / SIGNUP / RECOVERY
// ================================

async function handleAuth(event) {

    event.preventDefault();


    const emailInput =
        document.getElementById("authEmail");

    const passwordInput =
        document.getElementById("authPassword");

    const message =
        document.getElementById("authMessage");

    const submit =
        document.querySelector(".auth-submit");


    const email =
        emailInput
            ? emailInput.value.trim()
            : "";

    const password =
        passwordInput
            ? passwordInput.value
            : "";


    message.textContent =
        "Please wait...";

    submit.disabled = true;


    try {

        // ================================
        // PASSWORD RECOVERY
        // ================================

        if (authMode === "recovery") {

            if (password.length < 6) {

                throw new Error(
                    "Password must be at least 6 characters."
                );
            }


            const {
                error
            } =
                await supabaseClient.auth.updateUser({
                    password: password
                });


            if (error) throw error;


            message.textContent =
                "Password updated successfully! You can now login.";


            passwordInput.value = "";


            setTimeout(() => {

                authMode = "login";

                updateAuthModeUI();

            }, 1500);


            return;
        }


        // ================================
        // SIGN UP
        // ================================

        if (authMode === "signup") {

            const {
                error
            } =
                await supabaseClient.auth.signUp({
                    email: email,
                    password: password
                });


            if (error) throw error;


            message.textContent =
                "Account created successfully. Please check your email if confirmation is required.";


            return;
        }


        // ================================
        // LOGIN
        // ================================

        const {
            error
        } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });


        if (error) throw error;


        message.textContent =
            "Login successful!";


        setTimeout(() => {

            closeAuthModal();

        }, 700);


    } catch (error) {

        message.textContent =
            error.message ||
            "Authentication failed.";

    } finally {

        submit.disabled = false;
    }
}


// ================================
// FORGOT PASSWORD
// ================================

async function showForgotPassword() {

    const emailInput =
        document.getElementById("authEmail");

    const message =
        document.getElementById("authMessage");

    if (!emailInput || !message) return;


    const email =
        emailInput.value.trim();


    if (!email) {

        message.textContent =
            "Please enter your email address first.";

        emailInput.focus();

        return;
    }


    message.textContent =
        "Sending password reset email...";


    try {

        const redirectUrl =
            window.location.origin +
            window.location.pathname;


        const {
            error
        } =
            await supabaseClient.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo: redirectUrl
                }
            );


        if (error) throw error;


        message.textContent =
            "Password reset email sent. Please check your email.";


    } catch (error) {

        message.textContent =
            error.message ||
            "Unable to send reset email.";
    }
}


// ================================
// LOGOUT
// ================================

async function logoutUser() {

    if (!supabaseClient) return;


    const {
        error
    } =
        await supabaseClient.auth.signOut();


    if (error) {

        alert(error.message);

        return;
    }


    updateAuthUI();
}


// ================================
// AUTH UI
// ================================

async function updateAuthUI() {

    if (!supabaseClient) return;


    const {
        data: {
            session
        }
    } =
        await supabaseClient.auth.getSession();


    const loginBtn =
        document.getElementById("loginBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");


    if (!loginBtn || !logoutBtn) return;


    if (session) {

        loginBtn.classList.add("hidden");

        logoutBtn.classList.remove("hidden");

    } else {

        loginBtn.classList.remove("hidden");

        logoutBtn.classList.add("hidden");
    }
}


// ================================
// BUTTONS
// ================================

function setupAuthButtons() {

    const loginBtn =
        document.getElementById("loginBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");


    if (loginBtn) {

        loginBtn.addEventListener(
            "click",
            () => {

                authMode = "login";

                updateAuthModeUI();

                openAuthModal();
            }
        );
    }


    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            logoutUser
        );
    }
}


// ================================
// OPEN MODAL
// ================================

function openAuthModal() {

    const modal =
        document.getElementById("authModal");


    if (!modal) return;


    modal.classList.add("active");
}


// ================================
// CLOSE MODAL
// ================================

function closeAuthModal() {

    const modal =
        document.getElementById("authModal");


    if (!modal) return;


    modal.classList.remove("active");
}


// ================================
// START
// ================================

document.addEventListener(
    "DOMContentLoaded",
    initAuth
);
