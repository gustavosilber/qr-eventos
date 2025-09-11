export const attendeesList = [
  "Claudio Eckerman",
  "Claudio Eckerman (Acomp.)",
  "Mariana Romero",
  "Nancy Silvera",
  "Yesica Oyola",
  "Claudio Gatica",
  "Claudia Paratore",
  "Noelia Ambrosino",
  "Luis Alaniz",
  "Sergio Lopez",
  "Fernando Somenzini",
  "Nestor Fabian Gomez",
  "Jose Damian Nievas",
  "Rosa Margarita Allende",
  "Magali Veneciano",
  "Jorge Mantel",
  "Sergio Ramirez",
  "Nancy Quiroga",
  "Gonzalo Sosa",
  "Maria Isabel Guridi",
  "Paola Gabriela Pelallo",
  "Sonia Soledad Pavez",
  "Cinthia Velazquez",
  "Dario Bouzout",
  "Mariella Besos",
  "Noelia Pierini",
  "Angeles Cohen",
  "Cami Gastaldi",
  "Estefania Salomon",
  "Cinthia Torres",
  "Daniela Villalba",
  "Paula Dulitsky",
  "Carla Estefania Zuniga",
  "Mercedes Flores",
  "Enrique Sueldo",
  "Lucas Matias Micelotta",
  "Catalina Lucerna",
  "Eduardo Alejandro Pereyra",
  "Maria Isabel Eberhardt",
  "Luciana Buiatti",
  "Emanuelle Barrera Alvarez",
  "Elizabeth French",
  "Daniel Osvaldo Rossi",
  "Cintia Huguenet",
  "Hugo Daniel Rivero",
  "Paola Vanesa Bravo",
  "Piccolo Rosario",
  "Castillo Ariel",
  "Daniela Soria",
  "Romina Leone",
  "Melisa Leone",
  "Leonardo Camardelli",
  "Paola Robledo",
  "Fabiana Robledo",
  "Rodrigo Blanco",
  "Carlos Olmos",
  "Ariel Sotelo",
  "Silvana Ramirez",
  "Blanca Elizabeth Alfonso",
  "Nadia Vanesa Molina",
  "Andres Arregui",
  "Andres Arregui (Acomp.)",
  "Erika Daniela Fernandez",
  "Florencia Balmaceda",
  "Emilse Abigail Barros",
  "Gabriel Gonzalez",
  "Gabriel Gonzalez (Acomp.1)",
  "Gabriel Gonzalez (Acomp.2)",
  "Gabriel Gonzalez (Acomp.3)",
  "Carolina Murua",
  "Mauricio Martins",
  "Romina Gorostegui",
  "Antonella Rivera",
  "Veronica Mazuco",
  "Matias Gallicet",
  "Andrea Loza",
  "Diego Giordano",
  "Alicia Perez",
  "Diego Gonzalez",
  "Florencia Ana Sol Aiello",
  "Luciano Benitezx",
  "Tamara Chamorro",
  "Raul Esteban Signes",
  "Jose Gabriel Bustos Arito",
  "Paulina Falletti",
  "Silvana Araceli Sacre",
  "Daiana Edith Lopez Figueroa",
  "Maria Cecilia Valentini",
  "Walter Escudero",
  "Lucia Julieta Berardi",
  "Milagros Flores Kaspersky",
  "Matias Fernandez Cano",
  "Tamara Daniela Guiñazu",
  "Franco Rivero",
  "Daiana Quetglas",
  "Jennifer Olivera",
  "Kevin Diaz",
  "Jazmin Jara",
  "Ailin Santander",
  "Dario Calderon",
  "Edgar. Perez",
  "Anahi Vega",
  "Rosana Marchesi",
  "Quimey Velez",
  "Joel Isaias Casco Cardozo",
  "Catalina Torres",
  "Juan \"Chico Azukar\" Araujo",
  "FrenesIs (premio)",
  "Marian Ventura",
  "Rocio Espil",
  "Maca Ordoñez",
  "Felicia Lozada",
  "Alejandra Ponce",
  "Alejandro Sanches",
  "Raul Gomez",
  "Alfredo Lucero",
  "Ingrid Sanchez",
  "Griselda Sánchez",
  "Gabriel Melian",
  "Yamila Pizzinato",
  "Rodrigo Carbo",
  "Renzo Meyer",
  "Veronica Reta",
  "Julieta Fernandez",
  "Dianela Jazmin Urizar",
  "Sergio Mateo Smalko",
  "Jesica Velazquez",
  "Alex Arias",
  "Joaquin Godoy",
  "Victoria Aguilera",
  "Sergio Mariano Pizzutti",
  "Natalia Tambutti",
  "Marisa Flores",
  "Jose Funes",
  "Rocio Camila Altamirano",
  "Hugo Gomez",
  "Ruben Cuccia",
  "Yanina Aguilar"
];

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
    verified: true,
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