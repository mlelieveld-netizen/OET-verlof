// Werknemerslijst met personeelsnummers en namen
export const employees = {
  '123002': 'Remon Gilsing',
  '123004': 'Ed van de Ven',
  '123006': 'Kevin Slot',
  '123007': 'Thijs Steenbakkers',
  '123009': 'Aron van Vreede',
  '123021': 'Tomasz Zywica',
  '123023': 'Mark Verhoeven',
  '123025': 'Geert Maurix',
  '123033': 'Dorian Peters',
  '123034': 'Kelvin van Baalen',
  '123035': 'Bas Berkvens',
  '123042': 'Maickel Lelieveld',
  '123047': 'Dylan Lelieveld',
  '123048': 'Henri Wittebol',
  '123052': 'Robert Basters',
  '123054': 'Willem vari der Sanden',
  '123076': 'Mark Danyl',
  '123078': 'Marco Nabuurs',
  '123079': 'Lars van der Eridan',
  '123081': 'Uitzend 1',
  '123082': 'Uitzend 2',
  '123083': 'Zoltan Gombos',
  '123084': 'Janusz Solarewicz',
  '123085': 'Dynand Hanegraaf',
  '123086': 'Mike Schotanus',
  '123087': 'Falco Morelissen',
  '123088': 'Cristiaan Dinges',
  '123098': 'Stage 1',
  '123099': 'Stage 2',
};

// Functie om werknemer op te halen op basis van personeelsnummer
export const getEmployeeByNumber = (employeeNumber) => {
  return employees[employeeNumber] || null;
};

// Functie om alle werknemers op te halen als array
export const getAllEmployees = () => {
  return Object.entries(employees).map(([number, name]) => ({
    number,
    name,
  }));
};

// Functie om te zoeken op naam of nummer
export const searchEmployees = (query) => {
  if (!query) return [];
  
  const lowerQuery = query.toLowerCase();
  return Object.entries(employees)
    .filter(([number, name]) => 
      number.includes(query) || name.toLowerCase().includes(lowerQuery)
    )
    .map(([number, name]) => ({
      number,
      name,
    }));
};

