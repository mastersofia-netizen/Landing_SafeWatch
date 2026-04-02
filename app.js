// ==========================================================================
// CONFIGURACIÓN DE SUPABASE
// ==========================================================================
// Reemplaza 'TU_SUPABASE_URL' y 'TU_SUPABASE_ANON_KEY' con las credenciales de tu proyecto Supabase.
const SUPABASE_URL = 'https://ujusnpmnmvinkwafgbus.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqdXNucG1ubXZpbmt3YWZnYnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNjA0MzEsImV4cCI6MjA5MDczNjQzMX0.jS_muL3OhZw005D-aqkDgTOsnS945SM7LynDxf23LAU'; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================================================
// ESTADO Y REFERENCIAS DOM
// ==========================================================================
let currentUser = null;
let isLoginMode = false; // true = Login, false = Registro

// Elementos Auth
const authTitle = document.getElementById('authTitle');
const authMessage = document.getElementById('authMessage');
const authForm = document.getElementById('authForm');
const nameGroup = document.getElementById('nameGroup');
const nombreInput = document.getElementById('nombre');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authSwitchBtn = document.getElementById('authSwitchBtn');
const authSwitchText = document.getElementById('authSwitchText');
const navLoginBtn = document.getElementById('navLoginBtn');

const loggedInState = document.getElementById('loggedInState');
const userNameDisplay = document.getElementById('userNameDisplay');
const logoutBtn = document.getElementById('logoutBtn');

// Elementos Comentarios
const commentFormContainer = document.getElementById('commentFormContainer');
const loginPromptContainer = document.getElementById('loginPromptContainer');
const commentForm = document.getElementById('commentForm');
const comentarioTexto = document.getElementById('comentarioTexto');
const commentsList = document.getElementById('commentsList');

// ==========================================================================
// INICIALIZACIÓN
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Actualizar año en footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // Comprobar sesión actual
    await checkSession();
    
    // Cargar comentarios
    await fetchComments();

    // Event Listeners
    authSwitchBtn.addEventListener('click', toggleAuthMode);
    authForm.addEventListener('submit', handleAuthSubmit);
    logoutBtn.addEventListener('click', handleLogout);
    commentForm.addEventListener('submit', handleCommentSubmit);
});

// ==========================================================================
// FUNCIONES DE AUTENTICACIÓN
// ==========================================================================

async function checkSession() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
            currentUser = session.user;
            updateUIForLoggedInUser();
        } else {
            currentUser = null;
            updateUIForLoggedOutUser();
        }
        
        // Escuchar cambios de autenticación
        supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                currentUser = session.user;
                updateUIForLoggedInUser();
            } else {
                currentUser = null;
                updateUIForLoggedOutUser();
            }
        });
    } catch (err) {
        console.error('Error verificando sesión:', err);
    }
}

function updateUIForLoggedInUser() {
    // Esconder formulario auth, mostrar estado logueado
    authForm.classList.add('hidden');
    authTitle.classList.add('hidden');
    document.querySelector('.auth-switch').classList.add('hidden');
    
    loggedInState.classList.remove('hidden');
    
    // Obtener el nombre. Puede estar en user_metadata o usamos el email
    let displayName = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
    userNameDisplay.textContent = displayName;
    
    navLoginBtn.textContent = 'Mi Cuenta';
    navLoginBtn.href = '#registro';
    
    // Comentarios
    commentFormContainer.classList.remove('hidden');
    loginPromptContainer.classList.add('hidden');
}

function updateUIForLoggedOutUser() {
    // Mostrar formulario auth, esconder estado logueado
    authForm.classList.remove('hidden');
    authTitle.classList.remove('hidden');
    document.querySelector('.auth-switch').classList.remove('hidden');
    
    loggedInState.classList.add('hidden');
    
    navLoginBtn.textContent = 'Iniciar Sesión';
    
    // Comentarios
    commentFormContainer.classList.add('hidden');
    loginPromptContainer.classList.remove('hidden');
}

function toggleAuthMode(e) {
    if (e) e.preventDefault();
    isLoginMode = !isLoginMode;
    hideMessage();
    
    if (isLoginMode) {
        // Cambiar a Iniciar Sesión
        authTitle.textContent = 'Iniciar Sesión';
        nameGroup.classList.add('hidden');
        nombreInput.removeAttribute('required');
        authSubmitBtn.textContent = 'Ingresar';
        authSwitchText.textContent = '¿No tienes cuenta?';
        authSwitchBtn.textContent = 'Regístrate';
    } else {
        // Cambiar a Registro
        authTitle.textContent = 'Crear Cuenta';
        nameGroup.classList.remove('hidden');
        nombreInput.setAttribute('required', 'true');
        authSubmitBtn.textContent = 'Crear cuenta';
        authSwitchText.textContent = '¿Ya tienes cuenta?';
        authSwitchBtn.textContent = 'Inicia Sesión';
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    hideMessage();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    try {
        // Deshabilitar botón
        authSubmitBtn.disabled = true;
        authSubmitBtn.textContent = 'Procesando...';
        
        if (isLoginMode) {
            // LOGIN
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            showMessage('bg-success', '¡Inicio de sesión exitoso!');
        } else {
            // REGISTRO
            const name = nombreInput.value.trim();
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name
                    }
                }
            });
            if (error) throw error;
            showMessage('bg-success', 'Registro exitoso. ¡Bienvenido a SafeWatch!');
        }
        
        // Limpiar formulario
        authForm.reset();
        
    } catch (err) {
        showMessage('bg-error', `Error: ${err.message}`);
    } finally {
        authSubmitBtn.disabled = false;
        authSubmitBtn.textContent = isLoginMode ? 'Ingresar' : 'Crear cuenta';
    }
}

async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        showMessage('bg-success', 'Sesión cerrada correctamente.');
    } catch (err) {
        console.error('Error al cerrar sesión:', err);
    }
}

function showMessage(typeClass, text) {
    authMessage.textContent = text;
    authMessage.className = `message ${typeClass === 'bg-success' ? 'success' : 'error'}`;
    authMessage.classList.remove('hidden');
}

function hideMessage() {
    authMessage.classList.add('hidden');
    authMessage.textContent = '';
}

// ==========================================================================
// FUNCIONES DE COMENTARIOS
// ==========================================================================

async function fetchComments() {
    try {
        const { data: comentarios, error } = await supabase
            .from('comentarios')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (error) {
            // Si la tabla no existe o hay problemas de permisos.
            if(error.code === '42P01') {
                 commentsList.innerHTML = '<p class="text-center text-muted">Aún no hay comentarios (O la tabla no ha sido creada en Supabase).</p>';
                 console.warn("Tabla 'comentarios' debe ser creada en Supabase.");
            } else {
                 throw error;
            }
            return;
        }
        
        if (!comentarios || comentarios.length === 0) {
            commentsList.innerHTML = '<p class="text-center text-muted">Aún no hay comentarios. ¡Sé el primero!</p>';
            return;
        }
        
        renderComments(comentarios);
    } catch (err) {
        console.error('Error cargando comentarios:', err);
        commentsList.innerHTML = '<p class="text-center text-muted">No se pudieron cargar los comentarios.</p>';
    }
}

function renderComments(comentarios) {
    commentsList.innerHTML = '';
    
    comentarios.forEach(comentario => {
        // Formatear Fecha
        const fecha = new Date(comentario.created_at);
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        
        const card = document.createElement('div');
        card.className = 'comment-item';
        
        // Escapar HTML para seguridad (Simple)
        const safeNombre = escapeHTML(comentario.nombre);
        const safeTexto = escapeHTML(comentario.comentario);
        
        card.innerHTML = `
            <div class="comment-header">
                <span class="comment-author">${safeNombre}</span>
                <span class="comment-date">${fecha.toLocaleDateString('es-ES', options)}</span>
            </div>
            <div class="comment-body">
                <p>${safeTexto}</p>
            </div>
        `;
        
        commentsList.appendChild(card);
    });
}

async function handleCommentSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) return;
    
    const texto = comentarioTexto.value.trim();
    if (!texto) return;
    
    const submitBtn = commentForm.querySelector('button');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publicando...';
    
    try {
        let displayName = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
        
        const { data, error } = await supabase
            .from('comentarios')
            .insert([
                { 
                    user_id: currentUser.id, 
                    nombre: displayName, 
                    comentario: texto 
                }
            ]);
            
        if (error) throw error;
        
        comentarioTexto.value = '';
        await fetchComments(); // Recargar
        
    } catch (err) {
        console.error('Error publicando comentario:', err);
        alert(`Error al publicar: ${err.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publicar Comentario';
    }
}

// Utilidad para evitar XSS básico
function escapeHTML(str) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
}
