// Cassette Player App - YouTube Integration

// Audio feedback system
let audioCtx = null;

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Mechanical click sound
function playClickSound() {
  const ctx = initAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = 'highpass';
  filter.frequency.value = 1000;

  osc.type = 'square';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.02);

  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
}

// Tape insert/eject sound
function playTapeInsertSound() {
  const ctx = initAudioContext();

  // Mechanical clunk
  const noise = ctx.createBufferSource();
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
  }
  noise.buffer = noiseBuffer;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 400;
  noiseFilter.Q.value = 2;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.2, ctx.currentTime);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  // Thunk tone
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
  oscGain.gain.setValueAtTime(0.15, ctx.currentTime);
  oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.connect(oscGain);
  oscGain.connect(ctx.destination);

  noise.start(ctx.currentTime);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

// Fast-forward/rewind whirring sound
let whirringOsc = null;
let whirringGain = null;

function startWhirringSound() {
  const ctx = initAudioContext();

  if (whirringOsc) return; // Already playing

  whirringOsc = ctx.createOscillator();
  whirringGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  whirringOsc.type = 'sawtooth';
  whirringOsc.frequency.value = 80;

  filter.type = 'lowpass';
  filter.frequency.value = 500;

  whirringGain.gain.setValueAtTime(0, ctx.currentTime);
  whirringGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);

  whirringOsc.connect(filter);
  filter.connect(whirringGain);
  whirringGain.connect(ctx.destination);

  whirringOsc.start();
}

function stopWhirringSound() {
  if (whirringOsc && whirringGain) {
    const ctx = initAudioContext();
    whirringGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
    setTimeout(() => {
      if (whirringOsc) {
        whirringOsc.stop();
        whirringOsc = null;
        whirringGain = null;
      }
    }, 150);
  }
}

// Current playlist (will be set by selected tape)
let playlist = [];

// Tape data - each tape contains a YouTube video with timestamped tracks
const tapes = [
  {
    title: "Burmese Lofi Vol. 1 - 4",
    series: "T-120",
    tone: "mint",
    videoId: "QBU1VVd9qO4",
    artwork: "artwork/burmese_lofi_vol1-4.jpeg",
    tracks: [
      { title: "ပြန်မလာတော့ဘူးကွယ်", timestamp: "0:00" },
      { title: "ချစ်တာတစ်ခုတည်းသိတယ်", timestamp: "2:42" },
      { title: "သောကတောင်တန်း", timestamp: "4:46" },
      { title: "ဝေးများဝေးရင်", timestamp: "6:35" },
      { title: "အင်းလျားသို့", timestamp: "8:38" },
      { title: "မိုးလေးဖွဲတုန်း", timestamp: "10:41" },
      { title: "စာ", timestamp: "12:29" },
      { title: "မိုင်ပေါင်းကုဋေ", timestamp: "15:10" },
      { title: "နောက်ဆုံးရင်ခွင်", timestamp: "17:13" },
      { title: "အချစ်များသူ့ဆီမှာ", timestamp: "19:26" },
      { title: "တစ်နေ့နေ့တော့ချစ်လာလိမ့်မည်", timestamp: "21:40" },
      { title: "နေရာ(၂)", timestamp: "24:19" },
      { title: "မုန်းခိုင်းတိုင်းမမုန်းနိုင်ဘူး", timestamp: "27:11" },
      { title: "မချစ်ဘူးမပြောပါနဲ့", timestamp: "29:36" },
      { title: "ပြည့်စုံပါစေ", timestamp: "32:48" },
      { title: "ဆွေးတယ်", timestamp: "35:33" },
      { title: "သိပ်သိပ်ချစ်ရတယ်နွဲ့တင်ရယ်", timestamp: "37:05" },
      { title: "မှားပြန်တယ်", timestamp: "40:23" },
      { title: "ဆု", timestamp: "42:57" },
      { title: "ကြိုးကြာသံ", timestamp: "45:19" },
      { title: "မနဲ့မောင်", timestamp: "47:52" },
      { title: "ပါးစပ်ရာဇဝင်​လေးတစ်ခုဖြစ်ခဲ့ပြီ", timestamp: "51:11" },
      { title: "စိုးစိတ်တိုးတိတ်လွမ်းချိန်", timestamp: "53:35" },
      { title: "မျောက်ဖြစ်ချင်တယ်", timestamp: "55:46" },
      { title: "နွေရာသီလမ်းခွဲ", timestamp: "58:21" },
      { title: "လင်းခေးအဝင်", timestamp: "1:01:00" },
      { title: "ပြောမထွက်ခဲ့သူ", timestamp: "1:03:16" },
      { title: "တစ်စစီကျိုးပဲ့နေတယ်", timestamp: "1:04:58" },
      { title: "သီချင်းချစ်သူ", timestamp: "1:07:25" },
      { title: "မျက်နှာ", timestamp: "1:10:42" },
      { title: "အချစ်မျက်ဝန်း", timestamp: "1:13:45" },
      { title: "တကယ်ဆိုရင်", timestamp: "1:17:27" },
      { title: "ဆောင်းအိမ်မက်", timestamp: "1:19:36" }
    ]
  },
  {
    title: "ထူးအိမ်သင် - အတ္တပုံဆောင်ခဲများ",
    series: "T-120",
    tone: "coral",
    videoId: "lgTFK7eap5Y",
    artwork: "artwork/htooeainthin_atta_tape.jpeg",
    tracks: [
      { title: "ဆွေးတယ်", timestamp: "0:00" },
      { title: "တစ္ဆေအနမ်း", timestamp: "3:23" },
      { title: "ချစ်သူ့လက်ဆောင်", timestamp: "7:07" },
      { title: "ရာဇဝင်များရဲ့သတို့သမီး", timestamp: "11:25" },
      { title: "ဂျပ်ဆင်ထိပ်ကလရိပ်ပြာ", timestamp: "16:23" },
      { title: "ရော့ခ်အင်ရိုးအပျိုမ", timestamp: "21:10" },
      { title: "အခါလွန်တဲ့မိုး", timestamp: "25:15" },
      { title: "ရင်ခုန်ရင်အချစ်", timestamp: "29:54" },
      { title: "အမေ့ရဲ့ဒုက္ခအိုးလေး", timestamp: "35:52" },
      { title: "လွမ်းသူ့အိမ်မက်", timestamp: "41:00" },
      { title: "အစိမ်းရောင်တံခါးများ", timestamp: "44:50" },
      { title: "မြို့ပြညများ", timestamp: "48:23" },
      { title: "မင်းမရှိတဲ့နောက်", timestamp: "53:31" }
    ]
  },
  {
    title: "ထူးအိမ်သင် - ချစ်ခြင်းအားဖြင့်",
    series: "T-120",
    tone: "teal",
    videoId: "QxbXh6EaNBY",
    artwork: "artwork/htooeainthin_withlove_tape.jpeg",
    tracks: [
      { title: "ကြယ်တွေစုံတဲ့ည", timestamp: "0:00" },
      { title: "တုနှိုင်းမဲ့ရတနာ", timestamp: "4:17" },
      { title: "အလင်းဆိုင်ရဲ့သီချင်း", timestamp: "9:01" },
      { title: "တို့နှစ်ယောက်ရဲ့အိမ်", timestamp: "13:25" },
      { title: "ပြုသူအသစ်ဖြစ်သူအဟောင်း", timestamp: "17:07" },
      { title: "လူနဲ့အင်္ကျီ", timestamp: "21:43" },
      { title: "မိုးတိမ်ပြဇာတ်", timestamp: "24:47" },
      { title: "ဝေဒနာ", timestamp: "29:08" },
      { title: "ဟောင်းနွမ်းခဲ့သောနေ့ရက်လေးများ", timestamp: "33:01" },
      { title: "နောက်ဆုံးသီချင်း", timestamp: "38:25" },
      { title: "ငါတရားစီရင်တော်မူခန်း", timestamp: "42:36" },
      { title: "နှုတ်ဆက်တေး", timestamp: "47:14" }
    ]
  },
  {
    title: "စိုင်းထီးဆိုင် - ချယ်ရီကိုသာပန်ပါကွယ်",
    series: "T-120",
    tone: "rose",
    isPlaylist: true,
    artwork: "artwork/saihteesaing_cherry.jpeg",
    tracks: [
      { title: "ငယ်ချစ်ဦး", videoId: "OAeJLYuF_l4", duration: "3:34" },
      { title: "ဒီဆောင်းတစ်ည", videoId: "J-Y6jX4LWD0", duration: "4:12" },
      { title: "အဆုံးအဖြတ်", videoId: "doHBGTclJow", duration: "4:43" },
      { title: "ဆုတောင်းခဲ့ဖူးတယ်မိငယ်", videoId: "1uY5Hp7G44w", duration: "4:13" },
      { title: "အရင်လိုဘဝမျိုးရောက်ချင်တယ်", videoId: "P2e0AHhHT48", duration: "4:50" },
      { title: "ကျေနပ်ပါတော့", videoId: "HUWvUDWrSCc", duration: "5:22" },
      { title: "ချယ်ရီကိုသာပန်ပါကွယ်", videoId: "vyuNryfVCAE", duration: "4:21" },
      { title: "စိုင်းချစ်သူဟင်္သာမငယ်", videoId: "IHQboYgu7oc", duration: "2:50" },
      { title: "မိုး", videoId: "gtEqWWqWOHU", duration: "3:42" },
      { title: "နေရစ်တော့ကွယ်သွားတော့မယ်", videoId: "gv6G7w2XLZA", duration: "5:40" },
      { title: "မောင့်တစ်ပတ်နွမ်း", videoId: "GACPJBzYIMg", duration: "4:01" },
      { title: "ရေဆန်မှာချောရေစုန်မှာမော", videoId: "CPzvUBcX6IE", duration: "4:16" },
      { title: "အချစ်ကိုဦးစားပေးခဲ့သူ", videoId: "0-XK4aQkmy4", duration: "4:00" }
    ]
  },
  {
    title: "Burmese Lofi Vol. 5 - 8",
    series: "T-120",
    tone: "amber",
    videoId: "OPfQi5RvV3g",
    artwork: "artwork/burmese_lofi_vol5-8.jpeg",
    tracks: [
      { title: "ခေါင်းလောင်းလေးတွေ မြည်နေပြီ", timestamp: "0:00" },
      { title: "ရှမ်းပဲပုပ်လေးကျွန်တော်", timestamp: "2:30" },
      { title: "တောင်ပံပါရင်မင်းဆီကို", timestamp: "5:14" },
      { title: "ဆည်းဆာ", timestamp: "8:28" },
      { title: "ရင်သို့တိုးဝှေ့ဆဲပါခိုင်", timestamp: "10:50" },
      { title: "အချစ်စွမ်းအား", timestamp: "14:05" },
      { title: "ကြည်ဖြူပါတော့", timestamp: "16:48" },
      { title: "အချစ်ကအမှား", timestamp: "18:48" },
      { title: "ဒုတိယလူ", timestamp: "22:18" },
      { title: "ဝေးသွားတဲ့အခါ", timestamp: "26:02" },
      { title: "မြင်နေခွင့်လေး", timestamp: "29:51" },
      { title: "ယုံပါ", timestamp: "32:34" },
      { title: "အရင်ကဇာတ်လမ်း", timestamp: "36:22" },
      { title: "အရှုံးထက်ပိုသော", timestamp: "38:53" },
      { title: "အချစ်လို့ခေါ်သလား", timestamp: "41:15" },
      { title: "မဆုံတဲ့ဖူးစာ", timestamp: "44:52" },
      { title: "နွေ", timestamp: "47:34" },
      { title: "ကမ္ဘာမြေအဆုံးထိ", timestamp: "49:56" },
      { title: "သူ့အချစ်", timestamp: "51:53" },
      { title: "သစ္စာမပျက်ကြေး", timestamp: "53:50" },
      { title: "ညို့နိုင်လွန်းတဲ့ကျွန်မချစ်သူ", timestamp: "56:03" },
      { title: "မင်းရှိတဲ့မြို့", timestamp: "58:43" },
      { title: "တစ်ရက်တော့ငိုပါ", timestamp: "1:01:33" },
      { title: "နွေဦးပုံပြင်", timestamp: "1:03:55" },
      { title: "နှစ်သစ်ချစ်ဦး", timestamp: "1:07:04" },
      { title: "မူယာကြော့", timestamp: "1:08:53" },
      { title: "ချမ်းပါတယ်", timestamp: "1:11:03" },
      { title: "သင်္ကြန်မိုး", timestamp: "1:13:33" },
      { title: "တူးပို့တူးပို့", timestamp: "1:16:40" },
      { title: "သင်္ကြန်လုလင်", timestamp: "1:18:45" },
      { title: "နွေဦးကဗျာ", timestamp: "1:20:38" },
      { title: "နွေမ", timestamp: "1:22:30" }
    ]
  },
  {
    title: "Burmese Lofi Vol. 9 - 12",
    series: "T-120",
    tone: "olive",
    videoId: "iSFNuovGbWc",
    artwork: "artwork/burmese_lofi_vol9-12.jpeg",
    tracks: [
      { title: "လေပြေ", timestamp: "0:00" },
      { title: "မိုး", timestamp: "3:08" },
      { title: "ကိုယ့်အနားရှိစေချင်", timestamp: "6:01" },
      { title: "သဲနု", timestamp: "9:14" },
      { title: "မင်းကိုသတိရရင်", timestamp: "11:04" },
      { title: "ဝါဆို", timestamp: "13:38" },
      { title: "တစ်ခုသောမိုးဥတု၏တစ်နေ့သ၌", timestamp: "15:30" },
      { title: "ထာ၀ရ", timestamp: "17:06" },
      { title: "ကြယ်ပြာလေးနဲ့ဝေးပြီးနောက်", timestamp: "19:08" },
      { title: "မိုးရာသီထဲ", timestamp: "21:36" },
      { title: "မိုးစက်တင်လေ", timestamp: "24:03" },
      { title: "အခါလွန်မိုး", timestamp: "26:32" },
      { title: "မတွေ့ကြရင်အကောင်းသား", timestamp: "29:40" },
      { title: "ကြုံရင်ပြောပေးပါ", timestamp: "31:18" },
      { title: "အလွမ်းများ", timestamp: "34:09" },
      { title: "ငယ်သူမို့", timestamp: "37:44" },
      { title: "ထာဝရအဆုံးထိ", timestamp: "40:27" },
      { title: "ဒီကစောင့်နေသူ", timestamp: "43:18" },
      { title: "ကိုယ်ရေးရာဇ၀င်", timestamp: "46:22" },
      { title: "စိတ်ပူတယ်", timestamp: "48:04" },
      { title: "အနာဂတ်မဲ့", timestamp: "50:15" },
      { title: "မာလာဆောင်", timestamp: "52:06" },
      { title: "လွမ်းရယ်မပြေ", timestamp: "54:35" },
      { title: "ဂျပ်ဆင်ထိပ်ကလရိပ်ပြာ", timestamp: "56:47" },
      { title: "အလွမ်းရဲ့ည", timestamp: "59:12" },
      { title: "၈/၈၂ အင်းလျား", timestamp: "1:01:00" },
      { title: "မင်းစိတ်နဲ့ကိုယ့်ကို", timestamp: "1:02:57" },
      { title: "လိုက်ဖက်တဲ့ဘဝ", timestamp: "1:04:56" },
      { title: "နောက်ဆုံးအချစ်", timestamp: "1:07:39" },
      { title: "သီးသန့်ဖြစ်တည်မှု", timestamp: "1:09:56" },
      { title: "အစဉ်အမြဲ", timestamp: "1:12:10" },
      { title: "သတိရရင်ပြီးတာပဲ", timestamp: "1:14:17" }
    ]
  },
  {
    title: "Burmese Lofi Vol. 13 - 16",
    series: "T-120",
    tone: "copper",
    videoId: "u-YNU0pzVUY",
    artwork: "artwork/burmese_lofi_vol13-16.jpeg",
    tracks: [
      { title: "အချစ်ကိုသိချိန်", timestamp: "0:00" },
      { title: "တစ်ခါတစ်လေတော့လည်း", timestamp: "2:15" },
      { title: "ရွှေရုပ်ကလေးကောက်ရသူ", timestamp: "5:04" },
      { title: "ဖျားတဲ့ည", timestamp: "7:07" },
      { title: "အချစ်ဆိုသည်မှာ", timestamp: "10:03" },
      { title: "ဂန္တဝင်ဆည်းဆာ", timestamp: "12:29" },
      { title: "ရိုးမြေကျ", timestamp: "14:57" },
      { title: "အရမ်းလွမ်းနေပြီ", timestamp: "17:06" },
      { title: "အပိုဆု", timestamp: "18:55" },
      { title: "အိမ်မက်ရဲ့အသက်", timestamp: "21:22" },
      { title: "သူမသိလည်း", timestamp: "23:50" },
      { title: "ချစ်ခွင့်ရချင်ပြီ", timestamp: "26:01" },
      { title: "တိတ်တိတ်လေးပဲချစ်သွားမယ်", timestamp: "28:29" },
      { title: "နှလုံးသားရဲ့ကျမ်းစာ", timestamp: "30:40" },
      { title: "မင်းအကြောင်းအိမ်မက်", timestamp: "33:07" },
      { title: "လေလွင့်ခြင်းလမ်းမများ", timestamp: "36:07" },
      { title: "ပေါ်တော်မူ", timestamp: "39:09" },
      { title: "တမ်းတခွင့်ပြုပါ", timestamp: "41:34" },
      { title: "အချစ်ဆိုတာလျှို့ဝှက်ချက်တစ်ခုပါ", timestamp: "44:22" },
      { title: "နွေဦးကံ့ကော်", timestamp: "46:29" },
      { title: "စာမျက်နှာတစ်ဆယ့်ငါး", timestamp: "49:02" },
      { title: "နှုတ်ခွန်းဆက်", timestamp: "51:30" },
      { title: "ငါ့ရဲ့လမင်း", timestamp: "52:56" },
      { title: "အချစ်သီချင်း", timestamp: "56:01" },
      { title: "အမေ့အိမ်", timestamp: "57:54" },
      { title: "ခဏတာ", timestamp: "59:56" },
      { title: "ငါ့ရင်ခွင်ကို", timestamp: "1:02:32" },
      { title: "မင်းလေးကိုချစ်လို့", timestamp: "1:04:21" },
      { title: "အိမ်ပြန်ချိန်", timestamp: "1:06:24" },
      { title: "သူသိသွားပြီ", timestamp: "1:08:07" },
      { title: "နီးနီးလေးနဲ့ဝေး", timestamp: "1:10:31" },
      { title: "ငယ်ချစ်ပုံပြင်", timestamp: "1:12:01" }
    ]
  },
  {
    title: "ခင်မောင်တိုး အကြိုက်ဆုံးခေါင်းစီးတေးများ",
    series: "T-120",
    tone: "teal",
    videoId: "coqtS89PBaY",
    artwork: "artwork/khinmaungtoe_favorite.jpeg",
    tracks: [
      { title: "မဟာဆန်သူ", timestamp: "0:00" },
      { title: "မျက်သွယ်", timestamp: "4:30" },
      { title: "ဝိုင်းရဲ့ဆည်းဆာ", timestamp: "8:00" },
      { title: "ရတနာသူ", timestamp: "12:55" },
      { title: "ဆည်းလည်းလှိုက်သံ", timestamp: "18:06" },
      { title: "အချစ်စစ်ဆိုတာ", timestamp: "23:40" },
      { title: "စောင်းကြိုးရှိုက်သံ", timestamp: "26:57" },
      { title: "ကြိုးကြာသံ", timestamp: "33:15" },
      { title: "ပန်းချစ်သူ", timestamp: "37:45" },
      { title: "ဝေးခဲ့ပြီပန်းခရမ်းပြာ", timestamp: "40:40" },
      { title: "ရောင်စဥ်ခုနစ်သွယ်", timestamp: "45:33" },
      { title: "လေးညှို့ရှင်", timestamp: "50:00" }
    ]
  }
];

// Current tape index
let currentTapeIndex = 0;

// YouTube Player instance
let ytPlayer = null;
let ytReady = false;
let ytProgressInterval = null;

// State
let currentTrackIndex = 0;
let isPlaying = false;
let volume = 0.7;

// DOM Elements
const playBtn = null;
const prevBtn = null;
const nextBtn = null;
const rewindBtn = null;
const forwardBtn = null;
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const volumeKnob = document.querySelector('.volume-knob');
const volumeDots = document.querySelectorAll('.volume-dots span');
let cassetteTapeArt = null;
let cassetteTapeArtImage = null;
// Track info is baked into SVG (static display)
const trackList = document.getElementById('trackList');
const trackCount = document.getElementById('trackCount');
const playlistTitle = document.getElementById('playlistTitle');
const cassetteTrackName = document.getElementById('cassetteTrackName');
const cassetteTapeName = document.getElementById('cassetteTapeName');
const tapeList = document.getElementById('tapeList');
const tapeCount = document.getElementById('tapeCount');
// SVG reel elements (accessed after SVG loads)
let reelLeftGroup = null;
let reelRightGroup = null;
let reelLeftRingGroup = null;
let reelRightRingGroup = null;
let svgDoc = null;
let reelAnimFrame = null;
let lastAnimTime = null;
let leftAngle = 0;
let rightAngle = 0;
let leftRingAngle = 0;
let rightRingAngle = 0;

// Tape shelf data is defined above with tracks
// Wait for SVG to load and setup reel references
const cassetteSvg = document.getElementById('cassetteSvg');
cassetteSvg.addEventListener('load', function() {
  svgDoc = cassetteSvg.contentDocument;
  if (svgDoc) {
    // Remove static text paths from the SVG label (legacy placeholders)
    const legacyTitle = svgDoc.getElementById('Legends Never Die');
    const legacyArtist = svgDoc.getElementById('League of Legends');
    if (legacyTitle) legacyTitle.remove();
    if (legacyArtist) legacyArtist.remove();
    // Fallback: remove any leftover text paths by id prefix
    svgDoc.querySelectorAll('path[id=\"Legends Never Die\"], path[id=\"League of Legends\"]').forEach(p => p.remove());
    // Cache the cassette tape art rect inside the SVG
    cassetteTapeArt = svgDoc.getElementById('cassetteTapeArt');
    cassetteTapeArtImage = svgDoc.getElementById('cassetteTapeArtImage');
    setupReelGroups();
    updateCassetteDisplay();
  }
});

function setupReelGroups() {
  if (!svgDoc) return;

  const svg = svgDoc.querySelector('svg');

  // Create left reel group
  reelLeftGroup = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g');
  reelLeftGroup.setAttribute('id', 'reel-left-spin');

  // Create right reel group
  reelRightGroup = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g');
  reelRightGroup.setAttribute('id', 'reel-right-spin');

  // Create left ring group
  reelLeftRingGroup = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g');
  reelLeftRingGroup.setAttribute('id', 'reel-left-ring');

  // Create right ring group
  reelRightRingGroup = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'g');
  reelRightRingGroup.setAttribute('id', 'reel-right-ring');

  // Find and move left reel spokes to group
  const leftSpokes = svgDoc.querySelectorAll('rect[x="306"], rect[x="293"], rect[x="308.795"]');
  const leftHub = svgDoc.querySelector('#Ellipse\\ 14');
  const leftAnchor = leftSpokes[0] || leftHub;
  if (leftAnchor) leftAnchor.parentNode.insertBefore(reelLeftGroup, leftAnchor);
  leftSpokes.forEach(spoke => reelLeftGroup.appendChild(spoke));
  if (leftHub) reelLeftGroup.appendChild(leftHub);

  // Find and move right reel spokes to group
  const rightSpokes = svgDoc.querySelectorAll('rect[x="461"], rect[x="448"], rect[x="463.795"]');
  const rightHub = svgDoc.querySelector('#Ellipse\\ 16');
  const rightAnchor = rightSpokes[0] || rightHub;
  if (rightAnchor) rightAnchor.parentNode.insertBefore(reelRightGroup, rightAnchor);
  rightSpokes.forEach(spoke => reelRightGroup.appendChild(spoke));
  if (rightHub) reelRightGroup.appendChild(rightHub);

  // Move ring elements into ring groups (prefer Subtract IDs)
  const leftRingEls = [
    svgDoc.querySelector('#Subtract'),
    svgDoc.querySelector('#Subtract_2'),
    svgDoc.querySelector('#Ellipse\\ 15')
  ].filter(Boolean);
  const leftTicks = svgDoc.querySelectorAll('#Rectangle\\ 19, #Rectangle\\ 20, #Rectangle\\ 21');
  const leftRingAnchor = leftRingEls[0] || leftTicks[0];
  if (leftRingAnchor) leftRingAnchor.parentNode.insertBefore(reelLeftRingGroup, leftRingAnchor);
  leftRingEls.forEach(el => reelLeftRingGroup.appendChild(el));
  leftTicks.forEach(tick => reelLeftRingGroup.appendChild(tick));

  const rightRingEls = [
    svgDoc.querySelector('#Subtract_3'),
    svgDoc.querySelector('#Subtract_4'),
    svgDoc.querySelector('#Ellipse\\ 17')
  ].filter(Boolean);
  const rightTicks = svgDoc.querySelectorAll('#Rectangle\\ 22, #Rectangle\\ 23, #Rectangle\\ 24');
  const rightRingAnchor = rightRingEls[0] || rightTicks[0];
  if (rightRingAnchor) rightRingAnchor.parentNode.insertBefore(reelRightRingGroup, rightRingAnchor);
  rightRingEls.forEach(el => reelRightRingGroup.appendChild(el));
  rightTicks.forEach(tick => reelRightRingGroup.appendChild(tick));
}

function animateReels(timestamp) {
  if (!isPlaying) {
    lastAnimTime = null;
    return;
  }
  if (!lastAnimTime) lastAnimTime = timestamp;
  const dt = (timestamp - lastAnimTime) / 1000;
  lastAnimTime = timestamp;

  leftAngle = (leftAngle + dt * 180) % 360;
  rightAngle = (rightAngle + dt * 180) % 360;
  leftRingAngle = (leftRingAngle + dt * 60) % 360;
  rightRingAngle = (rightRingAngle + dt * 60) % 360;

  if (reelLeftGroup) {
    reelLeftGroup.setAttribute('transform', `rotate(${leftAngle} 305.25 211.25)`);
  }
  if (reelRightGroup) {
    reelRightGroup.setAttribute('transform', `rotate(${rightAngle} 460.25 211.25)`);
  }
  if (reelLeftRingGroup) {
    reelLeftRingGroup.setAttribute('transform', `rotate(${leftRingAngle} 305.25 211.25)`);
  }
  if (reelRightRingGroup) {
    reelRightRingGroup.setAttribute('transform', `rotate(${rightRingAngle} 460.25 211.25)`);
  }

  reelAnimFrame = requestAnimationFrame(animateReels);
}

function startReelAnimation() {
  cancelAnimationFrame(reelAnimFrame);
  reelAnimFrame = requestAnimationFrame(animateReels);
}

function stopReelAnimation() {
  cancelAnimationFrame(reelAnimFrame);
  reelAnimFrame = null;
  lastAnimTime = null;
}
const trackBtns = document.querySelectorAll('.track-btn');
const playToggleBtn = document.querySelector('.track-btn[data-index="0"]');

// Initialize
function init() {
  // Load initial tape's tracks into playlist
  if (tapes[currentTapeIndex] && tapes[currentTapeIndex].tracks) {
    const tape = tapes[currentTapeIndex];
    if (tape.isPlaylist) {
      // Playlist tape: each track has its own videoId
      playlist = tape.tracks.map((track, index) => ({
        title: track.title,
        artist: tape.title,
        videoId: track.videoId,
        duration: track.duration || "—"
      }));
    } else {
      // Single video tape: tracks have timestamps
      playlist = tape.tracks.map((track, index) => ({
        title: track.title,
        artist: tape.title,
        timestamp: track.timestamp,
        startSeconds: parseTimestamp(track.timestamp),
        duration: calculateTrackDuration(tape.tracks, index)
      }));
    }
  }

  renderTapes();
  renderPlaylist();
  setupEventListeners();
  updateTrackCount();
  setKnobFromVolume(volume);
  updateCassetteDisplay();
  // YouTube player will handle video loading when ready
}

// Render playlist
function renderPlaylist() {
  const tapeName = tapes[currentTapeIndex]?.title || '';
  trackList.innerHTML = playlist.map((track, index) => `
    <div class="track-item ${index === currentTrackIndex ? 'active' : ''}" data-index="${index}">
      <span class="track-num">${String(index + 1).padStart(2, '0')}</span>
      <div class="track-details">
        <span class="track-name">${track.title}</span>
        <span class="track-artist-name">${tapeName}</span>
      </div>
      <span class="track-duration">${track.duration}</span>
    </div>
  `).join('');

  // Add click listeners to track items
  document.querySelectorAll('.track-item').forEach(item => {
    item.addEventListener('click', () => {
      const index = parseInt(item.dataset.index);
      loadTrack(index, true);
    });
  });
}

// Update track count
function updateTrackCount() {
  trackCount.textContent = `${playlist.length} tracks`;
}

let draggedTapeIndex = null;

function renderTapes() {
  if (!tapeList) return;
  tapeList.innerHTML = tapes.map((tape, index) => `
    <div class="tape-card ${index === currentTapeIndex ? 'active' : ''}" data-index="${index}" draggable="true">
      <div class="tape-art tone-${tape.tone} ${tape.artwork ? 'has-artwork' : ''}">
        ${tape.artwork ? `<img class="tape-image" src="${tape.artwork}" alt="" draggable="false" />` : ''}
        <div class="tape-title">${tape.title}</div>
        <div class="tape-series">${tape.series} SERIES</div>
        <div class="tape-stripes"></div>
        <div class="tape-cta">${tape.tracks.length || '—'}</div>
      </div>
    </div>
  `).join('');

  tapeCount.textContent = `${tapes.length} tapes`;

  tapeList.querySelectorAll('.tape-card').forEach(card => {
    // Click to select tape
    card.addEventListener('click', () => {
      const index = parseInt(card.dataset.index);
      const tape = tapes[index];

      // Only select if tape has content (either single video or playlist)
      if (!tape.videoId && !tape.isPlaylist) return;

      // Stop current playback
      if (isPlaying) {
        pauseTrack();
      }

      // Update active state
      tapeList.querySelectorAll('.tape-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      // Load the tape
      loadTape(index);
    });

    // Drag and drop events
    card.addEventListener('dragstart', (e) => {
      draggedTapeIndex = parseInt(card.dataset.index);
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      draggedTapeIndex = null;
      // Remove all drop indicators
      tapeList.querySelectorAll('.tape-card').forEach(c => {
        c.classList.remove('drag-over-left', 'drag-over-right');
      });
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const targetIndex = parseInt(card.dataset.index);
      if (draggedTapeIndex === null || draggedTapeIndex === targetIndex) return;

      // Determine if dropping left or right of target
      const rect = card.getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;

      card.classList.remove('drag-over-left', 'drag-over-right');
      if (e.clientX < midpoint) {
        card.classList.add('drag-over-left');
      } else {
        card.classList.add('drag-over-right');
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over-left', 'drag-over-right');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetIndex = parseInt(card.dataset.index);

      if (draggedTapeIndex === null || draggedTapeIndex === targetIndex) return;

      // Determine drop position
      const rect = card.getBoundingClientRect();
      const midpoint = rect.left + rect.width / 2;
      let newIndex = e.clientX < midpoint ? targetIndex : targetIndex + 1;

      // Adjust if dragging from before the target
      if (draggedTapeIndex < newIndex) {
        newIndex--;
      }

      // Reorder tapes array
      const [movedTape] = tapes.splice(draggedTapeIndex, 1);
      tapes.splice(newIndex, 0, movedTape);

      // Update currentTapeIndex if needed
      if (draggedTapeIndex === currentTapeIndex) {
        currentTapeIndex = newIndex;
      } else if (draggedTapeIndex < currentTapeIndex && newIndex >= currentTapeIndex) {
        currentTapeIndex--;
      } else if (draggedTapeIndex > currentTapeIndex && newIndex <= currentTapeIndex) {
        currentTapeIndex++;
      }

      // Re-render tapes
      renderTapes();
    });
  });
}

// Load track (seek to timestamp or load new video for playlists)
function loadTrack(index, autoPlay = false) {
  if (index < 0 || index >= playlist.length) return;

  // Trigger cassette wobble animation
  const cassetteEl = document.querySelector('.cassette');
  if (cassetteEl) {
    cassetteEl.classList.remove('wobble');
    // Force reflow to restart animation
    void cassetteEl.offsetWidth;
    cassetteEl.classList.add('wobble');
  }

  currentTrackIndex = index;
  const track = playlist[index];
  const tape = tapes[currentTapeIndex];

  // Track info
  totalTimeEl.textContent = track.duration || "0:00";

  if (ytPlayer && ytReady) {
    // Check if this is a playlist tape (each track has its own video)
    if (tape.isPlaylist && track.videoId) {
      // Load different video for playlist tapes
      ytPlayer.loadVideoById(track.videoId);
      if (!autoPlay) {
        // loadVideoById auto-plays, so pause if not autoPlay
        setTimeout(() => {
          if (!autoPlay) ytPlayer.pauseVideo();
        }, 100);
      }
    } else if (track.startSeconds !== undefined) {
      // Seek within single video for timestamp-based tapes
      ytPlayer.seekTo(track.startSeconds, true);
      if (autoPlay) {
        ytPlayer.playVideo();
      }
    }
  }

  // Update active states
  updateActiveStates();

  // Reset progress for this track
  progressFill.style.width = '0%';
  currentTimeEl.textContent = '0:00';
}

// Update active states
function updateActiveStates() {
  // Update track list
  document.querySelectorAll('.track-item').forEach((item, index) => {
    item.classList.toggle('active', index === currentTrackIndex);
  });

  // Update cassette display
  updateCassetteDisplay();
}

// Update cassette label display
function updateCassetteDisplay() {
  const track = playlist[currentTrackIndex];
  const tape = tapes[currentTapeIndex];

  if (cassetteTrackName && track) {
    cassetteTrackName.textContent = track.title;
  }
  if (cassetteTapeName && track) {
    cassetteTapeName.textContent = track.album || track.artist || '';
  }

  if (cassetteTapeArt && tape) {
    const toneMap = {
      mint: '#2f3a35',
      amber: '#3b2d26',
      teal: '#203137',
      rose: '#3b2731',
      olive: '#2d3327',
      copper: '#3a2b23'
    };
    const color = toneMap[tape.tone] || '#2f3a35';
    cassetteTapeArt.setAttribute('fill', color);
  }
  if (cassetteTapeArtImage) {
    if (tape && tape.artwork) {
      cassetteTapeArtImage.setAttribute('href', tape.artwork);
      cassetteTapeArtImage.style.display = 'block';
      // Extract prominent color and update cassette lines
      extractColorAndUpdateLines(tape.artwork);
    } else {
      cassetteTapeArtImage.style.display = 'none';
      // Reset to default line colors
      updateCassetteLines('#978A79', '#DED8CD');
    }
  }
  // Artwork only for cassette tape display (no labels)
}

// Extract prominent color from artwork and update cassette lines
function extractColorAndUpdateLines(artworkSrc) {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const sampleSize = 50;
    canvas.width = sampleSize;
    canvas.height = sampleSize;

    // Draw scaled image
    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

    // Get image data
    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imageData.data;

    // Simple color averaging with saturation weighting
    let totalR = 0, totalG = 0, totalB = 0, count = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < 128) continue; // Skip transparent pixels

      // Calculate saturation to weight colorful pixels more
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      const weight = 0.5 + saturation * 0.5;

      totalR += r * weight;
      totalG += g * weight;
      totalB += b * weight;
      count += weight;
    }

    if (count > 0) {
      const avgR = Math.round(totalR / count);
      const avgG = Math.round(totalG / count);
      const avgB = Math.round(totalB / count);

      // Create main color and lighter variant
      const mainColor = `rgb(${avgR}, ${avgG}, ${avgB})`;
      const lighterColor = `rgb(${Math.min(255, avgR + 60)}, ${Math.min(255, avgG + 60)}, ${Math.min(255, avgB + 60)})`;

      updateCassetteLines(mainColor, lighterColor);
    }
  };
  img.src = artworkSrc;
}

// Update the horizontal lines on the cassette
function updateCassetteLines(thickColor, thinColor) {
  if (!svgDoc) return;

  // All horizontal lines (Rectangle 2-9, thickest at bottom to thinnest at top)
  const rect2 = svgDoc.getElementById('Rectangle 2');
  const rect3 = svgDoc.getElementById('Rectangle 3');
  const rect4 = svgDoc.getElementById('Rectangle 4');
  const rect5 = svgDoc.getElementById('Rectangle 5');
  const rect6 = svgDoc.getElementById('Rectangle 6');
  const rect7 = svgDoc.getElementById('Rectangle 7');
  const rect8 = svgDoc.getElementById('Rectangle 8');
  const rect9 = svgDoc.getElementById('Rectangle 9');

  // Thin lines near track name (Rectangle 10-11) - hide them
  const rect10 = svgDoc.getElementById('Rectangle 10');
  const rect11 = svgDoc.getElementById('Rectangle 11');

  // Apply color to all horizontal lines
  if (rect2) rect2.setAttribute('fill', thickColor);
  if (rect3) rect3.setAttribute('fill', thickColor);
  if (rect4) rect4.setAttribute('fill', thickColor);
  if (rect5) rect5.setAttribute('fill', thickColor);
  if (rect6) rect6.setAttribute('fill', thickColor);
  if (rect7) rect7.setAttribute('fill', thickColor);
  if (rect8) rect8.setAttribute('fill', thickColor);
  if (rect9) rect9.setAttribute('fill', thickColor);
  if (rect10) rect10.style.display = 'none';
  if (rect11) rect11.style.display = 'none';
}

// Play track
function playTrack() {
  if (ytPlayer && ytReady) {
    ytPlayer.playVideo();
  }
  isPlaying = true;
  updatePlayButton();
  startReelAnimation();
}

// Pause track
function pauseTrack() {
  if (ytPlayer && ytReady) {
    ytPlayer.pauseVideo();
  }
  isPlaying = false;
  updatePlayButton();
  stopReelAnimation();
}

// Toggle play/pause
function togglePlay() {
  if (isPlaying) {
    pauseTrack();
  } else {
    playTrack();
  }
}

// Previous track
function prevTrack() {
  const newIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
  loadTrack(newIndex, isPlaying);
}

// Next track
function nextTrack() {
  const newIndex = (currentTrackIndex + 1) % playlist.length;
  loadTrack(newIndex, isPlaying);
}

// Rewind (skip back 10 seconds, stay within track)
function rewind() {
  // Play whirring sound briefly
  startWhirringSound();
  setTimeout(stopWhirringSound, 300);

  if (ytPlayer && ytReady && playlist.length > 0) {
    const currentTime = ytPlayer.getCurrentTime();
    const tape = tapes[currentTapeIndex];

    if (tape && tape.isPlaylist) {
      // Playlist tape: just go back 10 seconds, min 0
      const newTime = Math.max(0, currentTime - 10);
      ytPlayer.seekTo(newTime, true);
    } else {
      // Single video tape: stay within track bounds
      const track = playlist[currentTrackIndex];
      const trackStart = track.startSeconds || 0;
      const newTime = Math.max(trackStart, currentTime - 10);
      ytPlayer.seekTo(newTime, true);
    }
  }
}

// Fast forward (skip ahead 10 seconds, stay within track)
function fastForward() {
  // Play whirring sound briefly
  startWhirringSound();
  setTimeout(stopWhirringSound, 300);

  if (ytPlayer && ytReady && playlist.length > 0) {
    const currentTime = ytPlayer.getCurrentTime();
    const tape = tapes[currentTapeIndex];

    if (tape && tape.isPlaylist) {
      // Playlist tape: go forward 10 seconds, max video duration
      const videoDuration = ytPlayer.getDuration();
      const newTime = Math.min(videoDuration - 1, currentTime + 10);
      ytPlayer.seekTo(newTime, true);
    } else {
      // Single video tape: stay within track bounds
      let trackEnd;
      if (currentTrackIndex < playlist.length - 1) {
        trackEnd = playlist[currentTrackIndex + 1].startSeconds;
      } else {
        trackEnd = ytPlayer.getDuration();
      }

      const newTime = Math.min(trackEnd - 1, currentTime + 10);
      ytPlayer.seekTo(newTime, true);
    }
  }
}

// Update volume
function updateVolume(value) {
  volume = Math.max(0, Math.min(1, value));
  if (ytPlayer && ytReady) {
    ytPlayer.setVolume(volume * 100);
  }
  setKnobFromVolume(volume);
}

// Seek within current track
function seek(e) {
  const rect = progressBar.getBoundingClientRect();
  const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

  if (ytPlayer && ytReady && playlist.length > 0) {
    const tape = tapes[currentTapeIndex];
    const track = playlist[currentTrackIndex];

    if (tape && tape.isPlaylist) {
      // Playlist tape: seek within current video (0 to duration)
      const videoDuration = ytPlayer.getDuration();
      const seekTo = percent * videoDuration;
      ytPlayer.seekTo(seekTo, true);
    } else {
      // Single video tape: seek within timestamp range
      const trackStart = track.startSeconds || 0;

      // Get track end time
      let trackEnd;
      if (currentTrackIndex < playlist.length - 1) {
        trackEnd = playlist[currentTrackIndex + 1].startSeconds;
      } else {
        trackEnd = ytPlayer.getDuration();
      }

      const trackDuration = trackEnd - trackStart;
      const seekTo = trackStart + (percent * trackDuration);
      ytPlayer.seekTo(seekTo, true);
    }
  }
}

// Format time
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Progress is now handled by YouTube player state updates

// Setup event listeners
function setupEventListeners() {
  // Playback controls
  if (playBtn) playBtn.addEventListener('click', togglePlay);
  if (prevBtn) prevBtn.addEventListener('click', prevTrack);
  if (nextBtn) nextBtn.addEventListener('click', nextTrack);
  if (rewindBtn) rewindBtn.addEventListener('click', rewind);
  if (forwardBtn) forwardBtn.addEventListener('click', fastForward);

  // Progress bar
  progressBar.addEventListener('click', seek);

  // Volume
  if (volumeKnob) {
    const onPointerMove = (e) => {
      const rect = volumeKnob.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (deg > 180) deg -= 360;
      const clamped = Math.max(-135, Math.min(135, deg));
      const normalized = (clamped + 135) / 270;
      updateVolume(normalized);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    volumeKnob.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onPointerMove(e);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    });
  }

  // Track selector buttons
  trackBtns.forEach((btn, index) => {
    const press = () => btn.classList.add('pressed');
    const release = () => btn.classList.remove('pressed');
    btn.addEventListener('pointerdown', () => {
      press();
      playClickSound();
    });
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointerleave', release);
    btn.addEventListener('click', () => {
      press();
      setTimeout(release, 120);
    });
    btn.addEventListener('click', () => {
      if (index === 0) {
        togglePlay();
      } else if (index === 1) {
        nextTrack();
      } else if (index === 2) {
        prevTrack();
      } else if (index === 3) {
        fastForward();
      } else if (index === 4) {
        rewind();
      }
    });
  });

  // YouTube handles audio events via onPlayerStateChange

  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        rewind();
        break;
      case 'ArrowRight':
        fastForward();
        break;
      case 'ArrowUp':
        e.preventDefault();
        updateVolume(Math.min(1, volume + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        updateVolume(Math.max(0, volume - 0.1));
        break;
    }
  });

  // Playlist toggle
  const playlistToggle = document.getElementById('playlistToggle');
  const appEl = document.querySelector('.app');
  const playlistPanel = document.querySelector('.playlist-panel');

  if (playlistToggle && appEl && playlistPanel) {
    playlistToggle.addEventListener('click', () => {
      appEl.classList.toggle('playlist-hidden');
      playlistPanel.classList.toggle('hidden');
    });
  }
}

function setKnobFromVolume(value) {
  if (!volumeKnob) return;
  const angle = -135 + value * 270;
  volumeKnob.style.transform = `rotate(${angle}deg)`;
  volumeKnob.setAttribute('aria-valuenow', Math.round(value * 100).toString());
  const litCount = Math.round(value * (volumeDots.length - 1));
  volumeDots.forEach((dot, i) => {
    dot.classList.toggle('active', i <= litCount);
  });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

// YouTube IFrame API Ready callback
function onYouTubeIframeAPIReady() {
  const tape = tapes[currentTapeIndex];
  const initialVideoId = tape?.isPlaylist
    ? (tape.tracks[0]?.videoId || 'QBU1VVd9qO4')
    : (tape?.videoId || 'QBU1VVd9qO4');
  ytPlayer = new YT.Player('youtubePlayer', {
    height: '1',
    width: '1',
    videoId: initialVideoId,
    playerVars: {
      'autoplay': 0,
      'controls': 0,
      'disablekb': 1,
      'modestbranding': 1,
      'rel': 0
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onError': onPlayerError
    }
  });
}

// YouTube Player Ready
function onPlayerReady(event) {
  ytReady = true;
  ytPlayer.setVolume(volume * 100);

  // Load tracks from the selected tape
  loadTape(currentTapeIndex);
}

// Load a tape and its tracks
function loadTape(tapeIndex) {
  // Play tape insert sound
  playTapeInsertSound();

  currentTapeIndex = tapeIndex;
  const tape = tapes[tapeIndex];

  if (!tape || (!tape.videoId && !tape.isPlaylist)) return;

  // Build playlist from tape tracks
  if (tape.isPlaylist) {
    // Playlist tape: each track has its own videoId
    playlist = tape.tracks.map((track, index) => ({
      title: track.title,
      artist: tape.title,
      videoId: track.videoId,
      duration: track.duration || "—"
    }));
  } else {
    // Single video tape: tracks have timestamps
    playlist = tape.tracks.map((track, index) => ({
      title: track.title,
      artist: tape.title,
      timestamp: track.timestamp,
      startSeconds: parseTimestamp(track.timestamp),
      duration: calculateTrackDuration(tape.tracks, index)
    }));
  }

  // Load the video
  if (ytPlayer && ytReady) {
    if (tape.isPlaylist && tape.tracks.length > 0) {
      // Load first track's video for playlist tapes
      ytPlayer.cueVideoById(tape.tracks[0].videoId);
    } else if (tape.videoId) {
      ytPlayer.cueVideoById(tape.videoId);
    }
  }

  // Update UI
  if (playlistTitle) {
    playlistTitle.textContent = tape.title;
  }
  renderPlaylist();
  updateTrackCount();
  currentTrackIndex = 0;
  updateActiveStates();
  updateCassetteDisplay();

  // Reset progress
  progressFill.style.width = '0%';
  currentTimeEl.textContent = '0:00';
  if (playlist.length > 0) {
    totalTimeEl.textContent = playlist[0].duration;
  }
}

// Parse timestamp string to seconds
function parseTimestamp(timestamp) {
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

// Calculate track duration based on next track's timestamp
function calculateTrackDuration(tracks, index) {
  const currentStart = parseTimestamp(tracks[index].timestamp);
  if (index < tracks.length - 1) {
    const nextStart = parseTimestamp(tracks[index + 1].timestamp);
    return formatTime(nextStart - currentStart);
  }
  return "3:00"; // Default duration for last track
}

// YouTube Player State Change
function onPlayerStateChange(event) {
  switch (event.data) {
    case YT.PlayerState.PLAYING:
      if (!isPlaying) {
        isPlaying = true;
        updatePlayButton();
        startReelAnimation();
      }
      startYTProgressUpdate();
      break;

    case YT.PlayerState.PAUSED:
      if (isPlaying) {
        isPlaying = false;
        updatePlayButton();
        stopReelAnimation();
      }
      stopYTProgressUpdate();
      break;

    case YT.PlayerState.ENDED:
      // Video ended - auto-advance for playlist tapes
      const tape = tapes[currentTapeIndex];
      if (tape && tape.isPlaylist) {
        // Auto-advance to next track for playlist tapes
        if (currentTrackIndex < playlist.length - 1) {
          nextTrack();
        } else {
          // End of playlist
          isPlaying = false;
          updatePlayButton();
          stopReelAnimation();
          stopYTProgressUpdate();
        }
      } else {
        // Single video tape - stop playback
        isPlaying = false;
        updatePlayButton();
        stopReelAnimation();
        stopYTProgressUpdate();
      }
      break;

    case YT.PlayerState.CUED:
      // Video is ready
      break;
  }
}

// YouTube Player Error
function onPlayerError(event) {
  console.error('YouTube Player Error:', event.data);
  // Skip to next track on error
  if (event.data === 150 || event.data === 101) {
    // Video unavailable or embedding disabled
    nextTrack();
  }
}

// Update play button state
function updatePlayButton() {
  if (playToggleBtn) {
    playToggleBtn.querySelector('.material-symbols-rounded').textContent = isPlaying ? 'pause' : 'play_arrow';
    playToggleBtn.classList.toggle('active', isPlaying);
  }
}

// Start YouTube progress updates
function startYTProgressUpdate() {
  stopYTProgressUpdate();
  ytProgressInterval = setInterval(() => {
    if (ytPlayer && ytReady && isPlaying && playlist.length > 0) {
      const currentTime = ytPlayer.getCurrentTime();
      const tape = tapes[currentTapeIndex];
      const track = playlist[currentTrackIndex];

      if (tape && tape.isPlaylist) {
        // Playlist tape: track progress is 0 to video duration
        const videoDuration = ytPlayer.getDuration();
        if (videoDuration > 0) {
          const percent = Math.max(0, Math.min(100, (currentTime / videoDuration) * 100));
          progressFill.style.width = `${percent}%`;
          currentTimeEl.textContent = formatTime(currentTime);
          totalTimeEl.textContent = formatTime(videoDuration);
        }
      } else {
        // Single video tape: track progress within timestamp range
        const trackStart = track.startSeconds || 0;

        // Get track end time (next track's start or video end)
        let trackEnd;
        if (currentTrackIndex < playlist.length - 1) {
          trackEnd = playlist[currentTrackIndex + 1].startSeconds;
        } else {
          trackEnd = ytPlayer.getDuration();
        }

        const trackDuration = trackEnd - trackStart;
        const trackProgress = currentTime - trackStart;

        if (trackDuration > 0) {
          const percent = Math.max(0, Math.min(100, (trackProgress / trackDuration) * 100));
          progressFill.style.width = `${percent}%`;
          currentTimeEl.textContent = formatTime(Math.max(0, trackProgress));

          // Auto-advance to next track when current track ends
          if (currentTime >= trackEnd && currentTrackIndex < playlist.length - 1) {
            currentTrackIndex++;
            updateActiveStates();
            progressFill.style.width = '0%';
            currentTimeEl.textContent = '0:00';
            totalTimeEl.textContent = playlist[currentTrackIndex].duration;
          }
        }
      }
    }
  }, 250);
}

// Stop YouTube progress updates
function stopYTProgressUpdate() {
  if (ytProgressInterval) {
    clearInterval(ytProgressInterval);
    ytProgressInterval = null;
  }
}
