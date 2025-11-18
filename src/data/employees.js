// Werknemerslijst met personeelsnummers, namen en email adressen
export const employees = {
  '123002': { name: 'Remon Gilsing', email: 'remon.gilsing@oetelaar.nl' },
  '123004': { name: 'Ed van de Ven', email: 'ed.vandeven@oetelaar.nl' },
  '123006': { name: 'Kevin Slot', email: 'kevin.slot@oetelaar.nl' },
  '123007': { name: 'Thijs Steenbakkers', email: 'thijs.steenbakkers@oetelaar.nl' },
  '123009': { name: 'Aron van Vreede', email: 'aron.vanvreede@oetelaar.nl' },
  '123021': { name: 'Tomasz Zywica', email: 'tomasz.zywica@oetelaar.nl' },
  '123023': { name: 'Mark Verhoeven', email: 'mark.verhoeven@oetelaar.nl' },
  '123025': { name: 'Geert Maurix', email: 'geert.maurix@oetelaar.nl' },
  '123033': { name: 'Dorian Peters', email: 'dorian.peters@oetelaar.nl' },
  '123034': { name: 'Kelvin van Baalen', email: 'kelvin.vanbaalen@oetelaar.nl' },
  '123035': { name: 'Bas Berkvens', email: 'bas.berkvens@oetelaar.nl' },
  '123042': { name: 'Maickel Lelieveld', email: 'maickel.lelieveld@oetelaar.nl' },
  '123047': { name: 'Dylan Lelieveld', email: 'dylan.lelieveld@oetelaar.nl' },
  '123048': { name: 'Henri Wittebol', email: 'henri.wittebol@oetelaar.nl' },
  '123052': { name: 'Robert Basters', email: 'robert.basters@oetelaar.nl' },
  '123054': { name: 'Willem van der Sanden', email: 'willem.vandersanden@oetelaar.nl' },
  '123076': { name: 'Mark Danyl', email: 'mark.danyl@oetelaar.nl' },
  '123078': { name: 'Marco Nabuurs', email: 'marco.nabuurs@oetelaar.nl' },
  '123079': { name: 'Lars van der Eridan', email: 'lars.vandereridan@oetelaar.nl' },
  '123081': { name: 'Uitzend 1', email: 'uitzend1@oetelaar.nl' },
  '123082': { name: 'Uitzend 2', email: 'uitzend2@oetelaar.nl' },
  '123083': { name: 'Zoltan Gombos', email: 'zoltan.gombos@oetelaar.nl' },
  '123084': { name: 'Janusz Solarewicz', email: 'janusz.solarewicz@oetelaar.nl' },
  '123085': { name: 'Dynand Hanegraaf', email: 'dynand.hanegraaf@oetelaar.nl' },
  '123086': { name: 'Mike Schotanus', email: 'mike.schotanus@oetelaar.nl' },
  '123087': { name: 'Falco Morelissen', email: 'falco.morelissen@oetelaar.nl' },
  '123088': { name: 'Cristiaan Dinges', email: 'cristiaan.dinges@oetelaar.nl' },
  '123098': { name: 'Stage 1', email: 'stage1@oetelaar.nl' },
  '123099': { name: 'Stage 2', email: 'stage2@oetelaar.nl' },
};

// Functie om werknemer op te halen op basis van personeelsnummer
export const getEmployeeByNumber = (employeeNumber) => {
  const employee = employees[employeeNumber];
  return employee ? employee.name : null;
};

// Functie om volledige werknemer data op te halen
export const getEmployeeData = (employeeNumber) => {
  const employee = employees[employeeNumber];
  if (!employee) return null;
  return {
    number: employeeNumber,
    name: employee.name,
    email: employee.email,
  };
};

// Functie om email adres op te halen
export const getEmployeeEmail = (employeeNumber) => {
  const employee = employees[employeeNumber];
  return employee ? employee.email : null;
};

// Functie om alle werknemers op te halen als array
export const getAllEmployees = () => {
  return Object.entries(employees).map(([number, data]) => ({
    number,
    name: data.name,
    email: data.email,
  }));
};

// Functie om te zoeken op naam of nummer
export const searchEmployees = (query) => {
  if (!query) return [];
  
  const lowerQuery = query.toLowerCase();
  return Object.entries(employees)
    .filter(([number, data]) => 
      number.includes(query) || data.name.toLowerCase().includes(lowerQuery)
    )
    .map(([number, data]) => ({
      number,
      name: data.name,
      email: data.email,
    }));
};

