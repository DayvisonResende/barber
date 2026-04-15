// --- Backend: Supabase (Configure suas chaves aqui) ---
const SUPABASE_URL = 'https://plhxtgbmmupojzbhpnpe.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bRVr0xmHMYC96km1wxpSog_ewkOTKTK';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Dados da Aplicação (Carregados do Supabase) ---
let SERVICES = [];
let BARBERS = [];
let CLIENTES = [];

const AVAILABLE_TIMES = Array.from({ length: 288 }).map((_, i) => {
    const hours = Math.floor(i / 12).toString().padStart(2, '0');
    const mins = ((i % 12) * 5).toString().padStart(2, '0');
    return `${hours}:${mins}`;
});

const AVATAR_OPTIONS = null; // Removido para Iniciais Simplificadas

// --- Estado e Lógica Central ---
