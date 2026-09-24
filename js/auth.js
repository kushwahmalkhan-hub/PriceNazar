// ================================
// PriceNazar - Supabase Authentication
// ================================

const SUPABASE_URL =
    "https://fpkkyppdhkngkktkrbji.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_ib6fxqUCmPPGcJZE0Yqo3A_9Y8pUSXM";

let supabaseClient = null;
let authMode = "login";
let authInitialized = false;


// ================================
// INIT AUTH
// ================================

async function initAuth() {

    if (authInitialized) return;

    authInitialized = true;

    try {

        const {
            createClient
        } = await import(
            "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm"
        );

        supabaseClient = createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY
        );

        console.log("Supabase initialized successfully");

        createAuthModal();

        setupAuthButtons();

        updateAuthUI();

        supabaseClient.auth.onAuthStateChange(
            (event, session) => {

                console.log(
                    "Supabase Auth Event:",
                    event
                );

                updateAuthUI();

            }
        );

    } catch (error) {

        console.error(
            "Supabase initialization failed:",
            error
        );

    }
}


// ================================
// AUTH MODAL
// ================================

function createAuthModal() {

    if (document.getElementById("authModal")) {
        return;
    }

    const modal =
        document.createElement("div");

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

                <h2 id="authTitle">
                    Login
                </h2>

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


    document
        .getElementById("authCloseBtn")
        ?.addEventListener(
            "click",
            closeAuthModal
        );


    document
        .getElementById("authForm")
        ?.addEventListener(
            "submit",
            handleAuth
        );


    document
        .getElementById("authSwitchBtn")
        ?.addEventListener(
            "click",
            toggleAuthMode
        );


    document
        .getElementById("forgotPasswordBtn")
        ?.addEventListener(
            "click",
            showForgotPassword
        );

}


// ================================
// AUTH MODE
// ================================

function toggleAuthMode() {

    if (authMode === "login") {

        authMode = "signup";

    } else {

        authMode = "login";

    }

    updateAuthModeUI();

}


// ================================
// UPDATE AUTH MODE UI
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


    if (
        !title ||
        !subtitle ||
        !submit ||
        !switchText ||
        !switchBtn
    ) {
        return;
    }


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
            forgotBtn.style.display =
                "block";
        }

        if (email) {
            email.style.display =
                "block";
            email.required = true;
        }

        if (password) {
            password.style.display =
                "block";
            password.required = true;
            password.placeholder =
                "Password";
        }

        return;
    }


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
        forgotBtn.style.display =
            "block";
    }

    if (email) {
        email.style.display =
            "block";
        email.required = true;
    }

    if (password) {
        password.style.display =
            "block";
        password.required = true;
        password.placeholder =
            "Password";
    }

}


// ================================
// HANDLE AUTH
// ================================

async function handleAuth(event) {

    event.preventDefault();

    if (!supabaseClient) {

        showAuthMessage(
            "Authentication is still loading. Please try again."
        );

        return;
    }


    const email =
        document
            .getElementById("authEmail")
            ?.value
            .trim() || "";


    const password =
        document
            .getElementById("authPassword")
            ?.value || "";


    const submit =
        document.querySelector(".auth-submit");


    if (submit) {
        submit.disabled = true;
    }


    showAuthMessage(
        "Please wait..."
    );


    try {

        if (authMode === "signup") {

            const {
                error
            } =
                await supabaseClient.auth.signUp({
                    email,
                    password
                });


            if (error) {
                throw error;
            }


            showAuthMessage(
                "Account created successfully. Please check your email if confirmation is required."
            );

            return;
        }


        const {
            error
        } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });


        if (error) {
            throw error;
        }


        showAuthMessage(
            "Login successful!"
        );


        await updateAuthUI();


        setTimeout(
            closeAuthModal,
            500
        );


    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );


        showAuthMessage(
            error.message ||
            "Authentication failed."
        );

    } finally {

        if (submit) {
            submit.disabled = false;
        }

    }

}


// ================================
// FORGOT PASSWORD
// ================================

async function showForgotPassword() {

    if (!supabaseClient) {
        return;
    }


    const email =
        document
            .getElementById("authEmail")
            ?.value
            .trim() || "";


    if (!email) {

        showAuthMessage(
            "Please enter your email address first."
        );

        return;
    }


    try {

        showAuthMessage(
            "Sending password reset email..."
        );


        const redirectUrl =
            window.location.origin +
            window.location.pathname;


        const {
            error
        } =
            await supabaseClient.auth
                .resetPasswordForEmail(
                    email,
                    {
                        redirectTo:
                            redirectUrl
                    }
                );


        if (error) {
            throw error;
        }


        showAuthMessage(
            "Password reset email sent. Please check your email."
        );


    } catch (error) {

        showAuthMessage(
            error.message ||
            "Unable to send reset email."
        );

    }

}


// ================================
// LOGOUT
// ================================

async function logoutUser() {

    if (!supabaseClient) {
        return;
    }


    try {

        const {
            error
        } =
            await supabaseClient.auth.signOut();


        if (error) {
            throw error;
        }


        await updateAuthUI();

        console.log(
            "Logout successful"
        );


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            error.message ||
            "Unable to logout."
        );

    }

}


// ================================
// AUTH UI
// ================================

async function updateAuthUI() {

    if (!supabaseClient) {
        return;
    }


    const {
        data
    } =
        await supabaseClient.auth.getSession();


    const session =
        data?.session || null;


    const loginBtn =
        document.getElementById("loginBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");


    if (!loginBtn || !logoutBtn) {
        return;
    }


    if (session) {

        loginBtn.classList.add(
            "hidden"
        );

        logoutBtn.classList.remove(
            "hidden"
        );

    } else {

        loginBtn.classList.remove(
            "hidden"
        );

        logoutBtn.classList.add(
            "hidden"
        );

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

        loginBtn.onclick =
            function () {

                authMode = "login";

                updateAuthModeUI();

                openAuthModal();

            };

    }


    if (logoutBtn) {

        logoutBtn.onclick =
            function () {

                logoutUser();

            };

    }

}


// ================================
// MESSAGE
// ================================

function showAuthMessage(
    message
) {

    const element =
        document.getElementById(
            "authMessage"
        );


    if (element) {
        element.textContent =
            message;
    }

}


// ================================
// OPEN MODAL
// ================================

function openAuthModal() {

    const modal =
        document.getElementById(
            "authModal"
        );


    if (modal) {

        modal.classList.add(
            "active"
        );

    }

}


// ================================
// CLOSE MODAL
// ================================

function closeAuthModal() {

    const modal =
        document.getElementById(
            "authModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


// ================================
// START
// ================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initAuth,
        {
            once: true
        }
    );

} else {

    initAuth();

}
