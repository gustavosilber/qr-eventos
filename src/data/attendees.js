// Lista de asistentes con detalles (cargada desde CSV embebido o CSV externo)
import attendeesCSVRaw from './attendees.csv?raw';
const legacyAttendeesCSV = `Nombre,Abonado,Tipo de Entrada
Claudio Eckerman,15000,Social
Claudio Eckerman (Acomp.),15000,Social
Mariana Romero,15000,Social
Nancy Silvera,15000,Social
Yesica Oyola,15000,Social
Claudio Gatica,15000,Social
Claudia Paratore,15000,Social
Noelia Ambrosino,15000,Social
Luis Alaniz,15000,Social
Sergio Lopez,15000,Social
Fernando Somenzini,15000,Social
Nestor Fabian Gomez,15000,Social
Jose Damian Nievas,15000,Social
Rosa Margarita Allende,15000,Social
Magali Veneciano,15000,Social
Jorge Mantel,15000,Social
Sergio Ramirez,15000,Social
Nancy Quiroga,15000,Social
Edgar Gonzalo Sosa,5000,Social
Maria Isabel Guridi,15000,Social
Paola Gabriela Pelallo,15000,Social
Sonia Soledad Pavez,5000,Social
Cinthia Velazquez,15000,Social
Dario Bouzout,15000,Social
Mariella Besos,15000,Social
Noelia Pierini,15000,Social
Angeles Cohen,15000,Social
Cami Gastaldi,15000,Social
Estefania Salomon,30000,Full Pass
Cinthia Torres,0,Full Pass
Daniela Villalba,0,Full Pass
Paula Dulitsky,15000,Social
Carla Estefania Zuniga,15000,Social
Mercedes Isabel Flores,15000,Social
Enrique Sueldo,15000,Social
Lucas Matias Micelotta,40000,Full Pass
Catalina Lucerna,15000,Social
Eduardo Alejandro Pereyra,15000,Social
Maria Isabel Eberhardt,15000,Social
Luciana Buiatti,15000,Social
Emanuelle Barrera Alvarez,15000,Social
Elizabeth French,15000,Social
Daniel Osvaldo Rossi,15000,Social
Cintia Huguenet,15000,Social
Hugo Daniel Rivero,15000,Social
Paola Vanesa Bravo,15000,Social
Piccolo Rosario,5000,Social
Castillo Ariel,5000,Social
Daniela Soria,15000,Social
Romina Leone,15000,Social
Melisa Leone,15000,Social
Leonardo Camardelli,15000,Social
Paola Robledo,15000,Social
Fabiana Robledo,15000,Social
Rodrigo Blanco,15000,Social
Carlos Olmos,25000,1 Taller
Ariel Sotelo,15000,Social
Silvana Ramirez,15000,Social
Blanca Elizabeth Alfonso,15000,Social
Nadia Vanesa Molina,15000,Social
Andres Arregui,0,Social
Andres Arregui (Acomp.),0,Social
Erika Daniela Fernandez,15000,Social
Florencia Balmaceda,15000,Social
Emilse Abigail Barros,15000,Social
Gabriel Gonzalez,15000,Social
Gabriel Gonzalez (Acomp.1),15000,Social
Gabriel Gonzalez (Acomp.2),15000,Social
Gabriel Gonzalez (Acomp.3),15000,Social
Carolina Murua,15000,Social
Mauricio Martins,15000,Social
Romina Gorostegui,15000,Social
Antonella Rivera,15000,Social
Veronica Mazuco,15000,Social
Matias Gallicet,15000,Social
Andrea Loza,15000,Social
Diego Giordano,15000,Social
Alicia Perez,15000,Social
Diego Gonzalez,15000,Social
Florencia Ana Sol Aiello,15000,Social
Luciano Benitezx,7000,Social
Tamara Chamorro,8000,Social
Raul Esteban Signes,15000,Social
Jose Gabriel Bustos Arito,15000,Social
Paulina Falletti,15000,Social
Silvana Araceli Sacre,15000,Social
Daiana Edith Lopez Figueroa,15000,Social
Maria Cecilia Valentini,5000,Social
Walter Escudero,15000,Social
Lucia Julieta Berardi,15000,Social
Milagros Flores Kaspersky,5000,Social
Matias Fernandez Cano,5000,Social
Tamara Daniela Guiñazu,15000,Social
Franco Rivero,15000,Social
Daiana Quetglas,15000,Social
Jennifer Olivera,15000,Social
Kevin Diaz,15000,Social
Jazmin Jara,15000,Social
Ailin Santander,15000,Social
Dario Calderon,15000,Social
Edgar. Perez,FREE,Social
Anahi Vega,FREE,Social
Rosana Marchesi,15000,Social
Quimey Velez,15000,Social
Joel Isaias Casco Cardozo,15000,Social
Catalina Torres,15000,Social
"Juan ""Chico Azukar"" Araujo",15000,Social
FrenesIs (premio),15000,Social
Marian Ventura,FREE,Social
Rocio Espil,20000,Full Pass
Macarena Ordoñez,20000,Full Pass
Felicia Lozada,15000,Social
Alejandra Ponce,15000,Social
Alejandro Sanches,15000,Social
Raul Gomez,15000,Social
Alfredo Lucero,15000,Social
Ingrid Sanchez,15000,Social
Griselda Sanchez,15000,Social
Gabriel Melian,15000,Social
Yamila Pizzinato,15000,Social
Rodrigo Carbo,15000,Social
Renzo Meyer,FREE,Social
Veronica Reta,FREE,Social
Julieta Fernandez,18000,Social
Dianela Jazmin Urizar,15000,Social
Sergio Mateo Smalko ,5000,Social
Jesica Velazquez,5000,Social
Alex Arias,40000,Full Pass
Joaquin Godoy,15000,Social
Victoria Aguilera,15000,Social
Sergio Mariano Pizzutti,15000,Social
Natalia Tambutti ,15000,Social
Marisa Flores,15000,Social
Jose Funes,15000,Social
Rocio Camila Altamirano,15000,Social
Hugo Gomez,15000,Social
Ruben Cuccia,18000,Social
Yanina Aguilar,18000,Social
Sandra de Lucas,15000,Social
Diego Altamirano,15000,Social
Damian Juarez,9000,Social
Ariel Banegas,15000,Social
Natalia Roldan,18000,Social
Rosana Victoria Barrera,15000,Social
Claudia Juarez Matorras,18000,Social
Mercedes Lopez Moreno,18000,Social
Osvaldo Miguel Viscardi ,15000,Social
Daniel Eduardo Sánchez,35000,2 Talleres
Gabriel Arce,15000,Social
Roman Mercado,15000,Social
Consuelo Diaz,18000,Social
Carla Llanes,10000,Full Pass
Valeria Venturino,15000,Social
Carolina Liendro,0,Social
Mirko Calber,0,Social
Amalia Canuti,15000,Social
Juan Marco Lopez,15000,Social
Maria Magdalena Lavarello,15000,Social
Jorge Ferreyra,18000,Social
Mildre Ghirardotto,18000,Social
Barbara Karen Becerra,18000,Social
Barbara Karen Becerra (acomp),18000,Social
Julio Cesar Vazquez,18000,Social
Julio Cesar Vazquez (Acomp),18000,Social
Daniela Lucero,18000,Social
Alexander Tufilaro,18000,Social
Rebeca Lucero,9000,Social
Saromé Lucas,9000,Social
Juan Jose Idanez,18000,Social
Jessica Pizarro,18000,Social
Johanna Ortiz,18000,Social
Matias Ortiz,18000,Social
Bruno Bengolea,18000,Social
Daniela Rizzo,18000,Social
Vale Ziegler,FREE,Social
Milagros Abraham,18000,Social
Cristian Diaz,18000,Social
Pablo Dagostino,15000,Social
Cecilia Viviant,15000,Social
Jesica Gonzalez,18000,Social
Daniel Gutierrez,18000,Social
Daniela Piottante,18000,Social
Eduardo Rivara,18000,Social
Daniel Marin,18000,Social
Milena Benegas,18000,Social
Martin Paez,18000,Social
Federico Martin Real,15000,Social
Patricia Dimenza,18000,Social
Gilda De La Serna,15000,Social
Javier Bonansea,18000,Social
Pilar Ochoa,18000,Social
Laura Beatriz Rovaio,18000,Social
Leiza Dakoff,18000,Social
Andres Villarroel,18000,Social
Rosana Edith Giglio,18000,Social
Javier Enrique Barrionuevo ,18000,Social
Barbara Estefania Olivera,18000,Social
Amalia Canuti,18000,Social
Melina Gonzalez,15000,Social
Nicolas Ferreyra,FREE,Social
Lorena Broffoni,18000,Social
Alexander Mendoza,18000,Social
Jesica Lorena Antonio,18000,Social
Ricardo Torres,18000,Social
Sandra Acevedo,18000,Social
Vanesa Rezzano,18000,Social
Fabian Santucho,15000,Social
Sergio Sequier,15000,Social
Sofia Ariza,15000,Social
Sergio Schneider,15000,Social
Jesica Lorena Mansilla,15000,Social
Monica Ojeda,18000,Social
Matias Damian Barreda,18000,Social
Debora Chareun,18000,Social
Juan Guala,18000,Social
Belen Cruz,18000,Social
Fernanda Blanco,18000,Social
Lucas Albino,18000,Social
Diego Chiapero,Free,Social
Lauti Pollice,Free,Social
Chiara Spenza,Free,Social
Hugo Lescano,Free,Social
Erika,Free,Social
Primo Quevedo,Free,Social
Fabian Upegui,0,Social
Juan Sasso,15000,Social
Ingrid  Kilibarda,15000,Social
Aylen Ossa Welcz,15000,Social
Sofia Vallero,15000,Social
Nicolas Dominguez,15000,Social
Ornella Pietraccone,15000,Social
Fernando Capaso,15000,Social
Nuria Mando,15000,Social
Tobias  Alvarez,15000,Social
Ayelén  Farías,Free,Social
Emiliano Saul Escudero,18000,Social
Alberto Eduardo Vicari,18000,Social
Adrián Arturo Yépez Croquer,18000,Social
Bianca Randazzo,15000,Social
Maria cecilia morales,25000,Social
Silvia Robles,25000,Social
Jonathan Lucero,25000,Social
Trinidad Rojas,18000,Social
Hugo Luciano Arce Cabanas,18000,Social
Diego Aguilar,22000,Social
Jose Orlando Bustos,28000,1 Taller
Mayra Ludmila Luna Thedy,15000,Social
Martin Germán Mangone,15000,Social`;

// Parser legado (3 columnas) para compatibilidad
const parseAttendees = (csv) => {
  return csv.trim().split('\n').slice(1).map(line => {
    const parts = line.split(',');
    if (parts.length < 3) return null;
    const [rawNombre, abonado, tipoEntrada] = parts;
    const nombre = rawNombre.replace(/^"|"$/g, '');
    return { nombre, abonado, tipoEntrada };
  }).filter(Boolean);
};

// ------------------------------
// Nuevo parser CSV (5 columnas con encabezados)
// ------------------------------

const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
};

const normalizeHeader = (s) => {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

const parseAttendeesFromCSV = (raw) => {
  try {
    if (!raw || typeof raw !== 'string') return [];
    const lines = raw.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const isTSV = lines[0].includes('\t');
    const splitLine = (line) => isTSV ? line.split('\t') : parseCSVLine(line);
    const headers = splitLine(lines[0]).map(normalizeHeader);
    const idxNombre = headers.findIndex(h => h.startsWith('nombre'));
    const idxAbonado = headers.findIndex(h => h.startsWith('abonado'));
    const idxTipo = headers.findIndex(h => h.includes('tipo') && h.includes('entrada'));
    const idxComprobante = headers.findIndex(h => h.includes('comprobante'));
    const idxQR = headers.findIndex(h => h === 'qr');

    const details = [];
    for (const line of lines.slice(1)) {
      if (!line || !line.trim()) continue;
      const cols = splitLine(line);
      const get = (idx) => idx >= 0 ? (cols[idx] || '').trim() : '';
      const rawNombre = get(idxNombre);
      const nombre = rawNombre.replace(/^"|"$/g, '');
      if (!nombre) continue;
      const abonado = get(idxAbonado);
      const tipoEntrada = get(idxTipo);
      const comprobante = get(idxComprobante);
      const qrRaw = get(idxQR).toLowerCase();
      const hasQRColumn = idxQR >= 0;
      const qrIsFalse = hasQRColumn && (qrRaw === 'false' || qrRaw === 'no' || qrRaw === '0');
      if (qrIsFalse) continue; // excluir solo cuando QR es explícitamente FALSE
      const qrTrue = qrRaw === 'true' || qrRaw === 'si' || qrRaw === 'yes' || qrRaw === '1';
      details.push({ nombre, abonado, tipoEntrada, comprobante, qr: qrTrue });
    }
    return details;
  } catch (e) {
    console.error('Error parsing attendees CSV:', e);
    return [];
  }
};

const parsedFromFile = parseAttendeesFromCSV(attendeesCSVRaw);
export const attendeesDetails = parsedFromFile.length ? parsedFromFile : parseAttendees(legacyAttendeesCSV);
export const attendeesList = attendeesDetails.map(a => a.nombre);

// Función para obtener el estado de verificación desde localStorage
export const getVerificationStatus = () => {
  try {
    const stored = localStorage.getItem('qrVerificationStatus');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading verification status:', error);
    return {};
  }
};

// Función para guardar el estado de verificación en localStorage
export const saveVerificationStatus = (status) => {
  try {
    localStorage.setItem('qrVerificationStatus', JSON.stringify(status));
  } catch (error) {
    console.error('Error saving verification status:', error);
  }
};

// Función para marcar un asistente como verificado
export const markAttendeeAsVerified = (attendeeName) => {
  const status = getVerificationStatus();
  status[attendeeName] = {
    ...(status[attendeeName] || {}),
    verified: true,
    socialVerified: true,
    socialVerifiedAt: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    verifiedAt: new Date().toLocaleString('es-ES')
  };
  saveVerificationStatus(status);
  return status;
};

// Función para verificar si un nombre está en la lista
export const isAttendeeInList = (name) => {
  return attendeesList.some(attendee => 
    attendee.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(attendee.toLowerCase())
  );
};

// Función para encontrar el nombre exacto en la lista
export const findExactAttendee = (name) => {
  return attendeesList.find(attendee => 
    attendee.toLowerCase() === name.toLowerCase() ||
    attendee.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(attendee.toLowerCase())
  );
}; 

// Obtener detalles (abonado, tipo) por nombre
export const getAttendeeInfoByName = (name) => {
  const found = attendeesDetails.find(a => a.nombre.toLowerCase() === name.toLowerCase());
  if (found) return found;
  // fallback contiene/incluye
  return attendeesDetails.find(a => a.nombre.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(a.nombre.toLowerCase())) || null;
};

// ------------------------------
// Fuzzy matching helpers
// ------------------------------

const normalizeName = (s) => {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/\(acomp(ani?ante)?\.?\)/gi, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const toTokens = (s) => new Set(normalizeName(s).split(' ').filter(Boolean));

const tokenSetRatio = (a, b) => {
  const A = toTokens(a), B = toTokens(b);
  if (A.size === 0 && B.size === 0) return 0;
  const inter = [...A].filter(x => B.has(x)).length;
  const union = new Set([...A, ...B]).size || 1;
  return inter / union;
};

const levenshtein = (a, b) => {
  const s = normalizeName(a), t = normalizeName(b);
  const m = s.length, n = t.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
};

const normalizedLevenshtein = (a, b) => {
  const s = normalizeName(a), t = normalizeName(b);
  const maxLen = Math.max(s.length, t.length) || 1;
  return 1 - (levenshtein(s, t) / maxLen);
};

export const matchAttendeeName = (qrName) => {
  const candidates = attendeesList;
  let best = { name: null, score: 0, method: '' };
  for (const c of candidates) {
    const n1 = normalizeName(qrName);
    const n2 = normalizeName(c);
    if (!n1 || !n2) continue;
    if (n1 === n2) return { matched: true, certainty: 'high', bestName: c, score: 1, info: getAttendeeInfoByName(c) };
    const ts = tokenSetRatio(n1, n2);
    const lev = normalizedLevenshtein(n1, n2);
    const score = Math.max(ts, lev);
    if (score > best.score) best = { name: c, score, method: score === ts ? 'tokens' : 'lev' };
  }
  if (best.name) {
    const certainty = best.score >= 0.90 ? 'high' : (best.score >= 0.80 ? 'medium' : 'low');
    const matched = best.score >= 0.80;
    return { matched, certainty, bestName: best.name, score: best.score, info: getAttendeeInfoByName(best.name) };
  }
  return { matched: false, certainty: 'low', bestName: null, score: 0, info: null };
};

export const nameUtils = { normalizeName, tokenSetRatio, normalizedLevenshtein };

// ------------------------------
// Verification rules and helpers
// ------------------------------

export const getVerificationState = (attendeeName) => {
  const status = getVerificationStatus();
  return status[attendeeName] || { workshopsVerified: false, socialVerified: false };
};

export const isWorkshopsType = (tipoEntrada) => {
  if (!tipoEntrada) return false;
  const t = ('' + tipoEntrada).toLowerCase();
  return t.includes('taller') || t.includes('full pass');
};

export const isSocialOnlyType = (tipoEntrada) => {
  if (!tipoEntrada) return false;
  const t = ('' + tipoEntrada).toLowerCase();
  return t.includes('social') && !isWorkshopsType(tipoEntrada);
};

export const markWorkshopsVerified = (attendeeName) => {
  const status = getVerificationStatus();
  const prev = status[attendeeName] || {};
  status[attendeeName] = {
    ...prev,
    workshopsVerified: true,
    workshopsVerifiedAt: new Date().toISOString()
  };
  saveVerificationStatus(status);
  return status;
};

export const markSocialVerified = (attendeeName) => {
  const status = getVerificationStatus();
  const prev = status[attendeeName] || {};
  status[attendeeName] = {
    ...prev,
    socialVerified: true,
    socialVerifiedAt: new Date().toISOString(),
    // Compatibilidad con UI existente
    verified: true,
    verifiedAt: new Date().toLocaleString('es-ES')
  };
  saveVerificationStatus(status);
  return status;
};

export const canVerifyWorkshops = (attendeeName, tipoEntrada) => {
  if (!isWorkshopsType(tipoEntrada)) return false;
  const s = getVerificationState(attendeeName);
  return !s.workshopsVerified; // se verifica una sola vez
};

export const canVerifySocial = (attendeeName, tipoEntrada) => {
  const s = getVerificationState(attendeeName);
  if (s.socialVerified) return false; // no revalidar social
  if (isSocialOnlyType(tipoEntrada)) return true; // social-only, permitir una única vez
  // Para Full Pass / Talleres, permitir social sólo si talleres ya verificados
  if (isWorkshopsType(tipoEntrada)) return !!s.workshopsVerified;
  return false;
};