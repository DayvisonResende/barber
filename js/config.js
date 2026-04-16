// --- Backend: Supabase (Configure suas chaves aqui) ---
const SUPABASE_URL = 'https://plhxtgbmmupojzbhpnpe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsaHh0Z2JtbXVwb2p6YmhwbnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzk1MDMsImV4cCI6MjA5MDg1NTUwM30.xi2GoizxHsCFwQvW5otBrNFdxDhTE_MRmlOV3m0GYnA';
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
