// Shared song registry for CIRCLE MIX. Add future official or user songs here.
window.CircleMixSongs = [
  {
    id: "anima",
    title: "ANiMA",
    artist: "xi",
    audio: "#embedded-anima",
    jacket: null,
    bpm: 184.6,
    offset: -0.04,
    previewStart: 20,
    previewDuration: 15,
    difficulties: {
      normal: { label: "NORMAL", chart: "builtin:anima-normal" },
      tech: { label: "TECH", chart: "builtin:anima-tech" }
    }
  }
];

window.CircleMixSongRegistry = {
  all(){ return window.CircleMixSongs.slice(); },
  get(id){ return window.CircleMixSongs.find(song => song.id === id) || window.CircleMixSongs[0]; },
  hasDifficulty(song, difficulty){ return Boolean(song && song.difficulties && song.difficulties[difficulty]); }
};
