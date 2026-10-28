window.DypereJourney = {
  pick(bank, scores, currentRang) {
    const allowed = bank.filter(t => Math.abs(t.rang - currentRang) <= 1);
    if (!allowed.length) return bank[Math.floor(Math.random()*bank.length)];
    // Score basert på kategori
    const ranked = allowed.map(t => ({
      t,
      s: (scores[t.cat] || 0) - Math.abs(t.rang - currentRang)
    })).sort((a,b) => b.s - a.s);
    // Tilfeldig blant topp 5 for variasjon
    const top = ranked.slice(0, 5);
    return top[Math.floor(Math.random()*top.length)].t;
  }
};
