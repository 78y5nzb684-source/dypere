// Korte, lett utskiftbare tekster for hjemmesnarveien. Hvert alternativ er frivillig.
const QUICK_PUNISHMENTS = ["Stå i hjørnet i 10 minutter, hendene bak ryggen, uten å snakke.", "Skriv «Jeg skal adlyde Mester» 50 ganger og les dem høyt.", "Ingen orgasme de neste 24 timene.", "Be om lov før du sier noe resten av kvelden.", "Mester velger hva du har på deg i morgen.", "Tidlig leggetid – du legger deg når Mester sier.", "Ikke sitt i møbler den neste timen.", "Mester bestemmer middag, film og kveldens aktivitet.", "Skriv en unnskyldning, les den høyt, og takk Mester etterpå.", "Ingen telefon eller skjerm i en time.", "Kall Mester «Mester» hver gang du henvender deg til ham.", "Ikke se Mester i øynene uten at han gir lov.", "Gå på kne når du kommer inn i rommet der Mester er.", "Be om lov før du går på do.", "Takk Mester etter hver beskjed han gir deg.", "Ha en liten plug i rompa under klærne i 2 timer.", "Ingen truse under klærne en hel dag.", "Ha en vibrator i trusen – Mester styrer den.", "Ha klyper på nipplene under genseren i 20 minutter.", "Ha en buttplug i mens du gjør husarbeid.", "Send Mester et bilde hver time som bevis på at du adlyder.", "Gå en tur uten truse.", "Stå i hjørnet med plug i rompa.", "Ingen kos før du har gjort tre små oppgaver.", "Ha på deg noe Mester velger, selv om det kjennes flaut.", "Stå naken i hjørnet i 10 minutter, hendene bak ryggen.", "15 kontrollerte slag på rompa. Tell hvert slag og takk etterpå.", "Hold en posisjon (på kne, hender bak ryggen) i 5 minutter.", "Kald dusj.", "Ingen berøring eller kos før Mester sier det.", "Hold fitta åpen i ett minutt mens Mester ser.", "Sug på en dildo i 3 minutter uten å stoppe.", "Ha en plug i rompehullet i 15 minutter.", "Klyp nipplene 15 ganger, tell høyt.", "Spre rompeballene og hold dem slik i ett minutt.", "10 slag mellom rompeballene. Tell og takk.", "Fingre deg selv til du nærmer deg, så stopp på kommando.", "Sitt på en dildo i 5 minutter uten å bevege deg.", "Hold munnen åpen og ta imot spytt.", "Edge deg selv i 10 minutter. Mester bestemmer om du får komme.", "Ligge på magen med rompa opp og ta imot slag.", "Ha både plug i rompa og dildo i fitta samtidig.", "20 slag på rompa. Tell hvert eneste og takk Mester.", "Tigg pent om å få komme – og bli nektet.", "Hold beina spredt og vent på beskjed.", "Ha klyper på nipplene i 10 minutter.", "Bli tatt i rompa og ikke få komme.", "Stå på kne naken og vent til Mester sier noe.", "Vis frem fitta og rompehullet og hold stillingen.", "Bli edget med vibrator. Mester stopper når han vil.", "Ligge klar med bind for øynene.", "Bli holdt fast og fingret. Du får ikke komme.", "Takk Mester etter hvert slag eller hver berøring.", "Ikke få komme før Mester har kommet.", "Edge til du er på gråten, så får du lov – eller ikke."];
(() => {
  const button = document.getElementById('panicButton');
  const result = button?.querySelector('.panic-result');
  const initial = button?.querySelector('.panic-default');
  const text = document.getElementById('panicText');
  if (!button || !result || !initial || !text) return;
  let previous = -1;
  button.addEventListener('click', () => {
    let n = Math.floor(Math.random() * (QUICK_PUNISHMENTS.length - (previous < 0 ? 0 : 1)));
    if (previous >= 0 && n >= previous) n += 1;
    previous = n;
    text.textContent = QUICK_PUNISHMENTS[n];
    initial.hidden = true;
    result.hidden = false;
    button.classList.remove('is-pressed');
    void button.offsetWidth;
    button.classList.add('is-pressed');
    if (navigator.vibrate) navigator.vibrate(18);
  });
})();
