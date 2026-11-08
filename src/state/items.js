// Inventar („Tasche“): Items finden, tragen, Figuren geben. Ohne three.js → testbar.
// Neues Item: hier eintragen, dann mit ctx.place('pickup', { item: 'id', at }) verstecken
// oder per services.items.give('id') verschenken lassen.
export const ITEMS = {
  keks: { name: 'Haferkeks', icon: '🍪', desc: 'Duftet nach Butter. Katzen finden das interessant.' },
  feder: { name: 'Eulenfeder', icon: '🪶', desc: 'Von Professor Puschel. Damit schreibt man Briefe, die ankommen.' },
  samen: { name: 'Samentüte', icon: '🌱', desc: 'Von Gustav. »Am besten ganz oben pflanzen, wo die Bienen sind.«' },
  zahnrad: { name: 'Kleines Zahnrad', icon: '⚙️', desc: 'Passt in eine große Uhr. Welche? Eine, die stehen geblieben ist.' },
  schluessel: { name: 'Goldener Schlüssel', icon: '🗝️', desc: 'Aus dem Fundbüro. Gehört zu einer Truhe hoch oben.' },
  wolle: { name: 'Wollknäuel', icon: '🧶', desc: 'Weich wie eine Wolke. Schafe lieben so etwas.' },
  honig: { name: 'Glas Honig', icon: '🍯', desc: 'Von den Dachgarten-Bienen. Eine gewisse Teekanne hätte gern Honig.' },
  sternenstaub: { name: 'Sternenstaub', icon: '✨', desc: 'Glitzert in der Hand. Der Bibliothekar weiß, was man damit macht.' },
  brief: { name: 'Brief der Eulenpost', icon: '✉️', desc: 'Adressiert an dich. Absender: die Bibliothek.' },
  beere: { name: 'Funkenbeere', icon: '🫐', desc: 'Knistert leise. Kleine Drachen sind ganz verrückt danach.' },
  ticket: { name: 'Flugticket', icon: '🎫', desc: 'Gültig für einen Rundflug mit dem Luftschiff »Wolkenwal«.' },
  fischkeks: { name: 'Fischkeks', icon: '🐟', desc: 'Aus dem Fundbüro. Riecht nach Meer. Ein gewisser Pinguin wäre begeistert.' },
};

export function createItems({ progress, catalog = ITEMS, onChange = () => {} }) {
  return {
    catalog,
    get(id) { return catalog[id]; },
    has(id) { return progress.has('items', id); },
    /** Wurde das Item schon einmal benutzt/verschenkt (Fundstelle bleibt leer)? */
    used(id) { return progress.has('itemsUsed', id); },
    seen(id) { return progress.has('items', id) || progress.has('itemsUsed', id); },
    give(id) {
      if (!catalog[id] || this.seen(id)) return false;
      progress.mark('items', id);
      onChange('give', id);
      return true;
    },
    take(id) {
      if (!this.has(id)) return false;
      progress.remove('items', id);
      progress.mark('itemsUsed', id);
      onChange('take', id);
      return true;
    },
    list() { return Object.entries(catalog).filter(([id]) => progress.has('items', id)).map(([id, it]) => ({ id, ...it })); },
  };
}
