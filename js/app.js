// ── Storage (localStorage + Google Sheets 동기화) ──
const SYNC_KEYS = ['companies', 'templates', 'history', 'campaigns'];

const DB = {
  get: (key, def = []) => {
    try { return JSON.parse(localStorage.getItem('ma_' + key)) ?? def; } catch { return def; }
  },
  // 로컬에만 저장 (원격 푸시 없음 — 서버에서 받아올 때 사용)
  setLocal: (key, val) => localStorage.setItem('ma_' + key, JSON.stringify(val)),
  // 로컬 저장 + Google Sheets에 자동 푸시
  set: (key, val) => {
    DB.setLocal(key, val);
    if (SYNC_KEYS.includes(key)) SYNC.push(key, val);
  },
  id: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
};

// ── Google Sheets 동기화 레이어 ──
const SYNC = {
  url: () => (DB.get('config', {}).scriptUrl || '').trim(),
  enabled: () => !!SYNC.url(),

  // 서버에서 전체 데이터 받아와 로컬 갱신
  async load() {
    if (!SYNC.enabled()) return false;
    const res = await fetch(SYNC.url() + '?action=load', { redirect: 'follow' });
    const data = await res.json();
    SYNC_KEYS.forEach(k => { if (Array.isArray(data[k])) DB.setLocal(k, data[k]); });
    return true;
  },

  // 특정 키를 서버에 저장 (text/plain → CORS preflight 회피)
  async push(key, val) {
    if (!SYNC.enabled()) return;
    SYNC.setStatus('saving');
    try {
      await fetch(SYNC.url(), {
        method: 'POST',
        body: JSON.stringify({ action: 'sync', key, value: val ?? DB.get(key) }),
      });
      SYNC.setStatus('synced');
    } catch { SYNC.setStatus('offline'); }
  },

  // 전체 로컬 데이터를 서버에 일괄 업로드
  async pushAll() {
    if (!SYNC.enabled()) { toast('먼저 Apps Script URL을 설정하세요', 'error'); return; }
    SYNC.setStatus('saving');
    for (const k of SYNC_KEYS) {
      try {
        await fetch(SYNC.url(), { method: 'POST', body: JSON.stringify({ action: 'sync', key: k, value: DB.get(k) }) });
      } catch {}
    }
    SYNC.setStatus('synced');
    toast('전체 데이터 업로드 완료');
  },

  // 상태 뱃지
  setStatus(state) {
    const el = document.getElementById('syncBadge');
    if (!el) return;
    const map = {
      saving:  { t: '⏳ 동기화 중...', c: '#856404', bg: '#fff3cd' },
      synced:  { t: '☁️ 동기화됨',    c: '#155724', bg: '#d4edda' },
      offline: { t: '⚠️ 오프라인',    c: '#721c24', bg: '#f8d7da' },
      loading: { t: '🔄 불러오는 중...', c: '#1565c0', bg: '#e3f2fd' },
      local:   { t: '💾 로컬 모드',    c: '#6c757d', bg: '#e9ecef' },
    };
    const s = map[state] || map.local;
    el.textContent = s.t;
    el.style.color = s.c;
    el.style.background = s.bg;
  }
};

// 페이지 로드 시 서버에서 데이터 받아와 렌더 갱신
// 각 페이지는 window.MA_RENDER 에 자신의 렌더 함수를 등록
async function initSync() {
  injectSyncBadge();
  if (!SYNC.enabled()) { SYNC.setStatus('local'); return; }
  SYNC.setStatus('loading');
  try {
    await SYNC.load();
    if (typeof window.MA_RENDER === 'function') window.MA_RENDER();
    SYNC.setStatus('synced');
  } catch {
    SYNC.setStatus('offline');
  }
}

// 상단바에 동기화 상태 뱃지 자동 삽입
function injectSyncBadge() {
  if (document.getElementById('syncBadge')) return;
  const right = document.querySelector('.topbar-right');
  if (!right) return;
  const badge = document.createElement('span');
  badge.id = 'syncBadge';
  badge.style.cssText = 'font-size:11px;font-weight:700;padding:4px 10px;border-radius:12px;background:#e9ecef;color:#6c757d;';
  badge.textContent = '💾 로컬 모드';
  right.insertBefore(badge, right.firstChild);
}

document.addEventListener('DOMContentLoaded', initSync);

// ── Toast ──
function toast(msg, type = 'success') {
  const c = document.getElementById('toastContainer') || (() => {
    const el = document.createElement('div');
    el.id = 'toastContainer';
    el.className = 'toast-container';
    document.body.appendChild(el);
    return el;
  })();
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ── Modal ──
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) e.target.classList.remove('open');
  if (e.target.classList.contains('modal-close')) e.target.closest('.modal-backdrop')?.classList.remove('open');
});

// ── Active Nav ──
function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-menu a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === page);
  });
}
document.addEventListener('DOMContentLoaded', setActiveNav);

// ── Country list ──
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
];

function getCountry(code) {
  return COUNTRIES.find(c => c.code === code) || { code, name: code, flag: '🌐' };
}

// ── HTML 이스케이프 (innerHTML 삽입 시 깨짐/주입 방지) ──
function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function countryOptions(selected = '') {
  return COUNTRIES.map(c =>
    `<option value="${c.code}" ${c.code === selected ? 'selected' : ''}>${c.flag} ${c.name}</option>`
  ).join('');
}

// ── Status label ──
const STATUS_LABELS = {
  lead: '리드', contacted: '컨택 완료', replied: '회신 받음',
  deal: '거래 성사', rejected: '거절'
};
