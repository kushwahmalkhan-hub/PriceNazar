// ================================
// PriceNazar - Supabase Authentication
// ================================

const SUPABASE_URL = "https://fpkkyppdhkngkktkrbji.supabase.co";

// यहाँ अपना Supabase PUBLISHABLE KEY डालें
// Secret / Service key बिल्कुल नहीं डालना है.
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_ib6fxqUCmPPGcJZE0Yqo3A_9Y8pUSXM";

let supabaseClient = null;

async function initAuth() {
    const { createClient } =
        await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");

    supabaseClient = createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    createAuthModal();
    setupAuthButtons();
    updateAuthUI();

    supabaseClient.auth.onAuthStateChange(() => {
        updateAuthUI();
    });
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
                        required
                    >

                    <input
                        type="password"
                        id="authPassword"
                        placeholder="Password"
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

    document
        .getElementById("authCloseBtn")
        .addEventListener("click", closeAuthModal);

    document
        .getElementById("authForm")
        .addEventListener("submit", handleAuth);

    document
        .getElementById("authSwitchBtn")
        .addEventListener("click", toggleAuthMode);
}


// ================================
// LOGIN / SIGNUP
// ================================

let authMode = "login";

function toggleAuthMode() {

    authMode =
        authMode === "login"
            ? "signup"
            : "login";

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

    const message =
        document.getElementById("authMessage");

    message.textContent = "";

    if (authMode === "signup") {

        title.textContent = "Create Account";

        subtitle.textContent =
            "Create your PriceNazar account";

        submit.textContent = "Sign Up";

        switchText.textContent =
            "Already have an account?";

        switchBtn.textContent = "Login";

    } else {

        title.textContent = "Login";

        subtitle.textContent =
            "Login to your PriceNazar account";

        submit.textContent = "Login";

        switchText.textContent =
            "Don't have an account?";

        switchBtn.textContent = "Sign Up";
    }
}


async function handleAuth(event) {

    event.preventDefault();

    const email =
        document.getElementById("authEmail").value.trim();

    const password =
        document.getElementById("authPassword").value;

    const message =
        document.getElementById("authMessage");

    const submit =
        document.querySelector(".auth-submit");

    message.textContent = "Please wait...";

    submit.disabled = true;

    try {

        if (authMode === "signup") {

            const { error } =
                await supabaseClient.auth.signUp({
                    email,
                    password
                });

            if (error) throw error;

            message.textContent =
                "Account created successfully. Please check your email if confirmation is required.";

        } else {

            const { error } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) throw error;

            message.textContent =
                "Login successful!";

            setTimeout(() => {
                closeAuthModal();
            }, 700);
        }

    } catch (error) {

        message.textContent =
            error.message || "Authentication failed.";

    } finally {

        submit.disabled = false;
    }
}


// ================================
// LOGOUT
// ================================

async function logoutUser() {

    if (!supabaseClient) return;

    const { error } =
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
        data: { session }
    } = await supabaseClient.auth.getSession();

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
            openAuthModal
        );
    }

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            logoutUser
        );
    }
}


function openAuthModal() {

    const modal =
        document.getElementById("authModal");

    if (!modal) return;

    modal.classList.add("active");
}


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
