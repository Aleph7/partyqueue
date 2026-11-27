export type Language = "en" | "th";

export interface TranslationDictionary {
  appName: string;
  demoModeBadge: string;
  liveModeBadge: string;
  roomLabel: string;
  hostStageLink: string;
  guestRemoteLink: string;
  nowPlayingOnMac: string;
  nowPlaying: string;
  playing: string;
  paused: string;
  nothingPlaying: string;
  nothingPlayingHint: string;
  requestedBy: string;
  youBadge: string;
  upNext: string;
  queueEmptyGuest: string;
  queueEmptyHost: string;
  sortFifo: string;
  sortVotes: string;
  searchTab: string;
  directLinkTab: string;
  searchPlaceholder: string;
  searchButton: string;
  searching: string;
  noSearchResults: string;
  demoCatalogNotice: string;
  directLinkPlaceholder: string;
  fetchLinkButton: string;
  fetchingLink: string;
  invalidYoutubeLink: string;
  linkFetchFailed: string;
  addToQueue: string;
  adding: string;
  alreadyInQueue: string;
  addedToast: string;
  requestsLockedBanner: string;
  requestsLockedToast: string;
  quotaBadge: string;
  limitReachedToast: string;
  nicknameTitle: string;
  nicknameSubtitle: string;
  nicknamePlaceholder: string;
  nicknameSave: string;
  nicknameEdit: string;
  nicknameSuggestions: string[];
  upvote: string;
  upvoted: string;
  cancelRequest: string;
  hostPinTitle: string;
  hostPinSubtitle: string;
  hostPinDefaultHint: string;
  hostPinIncorrect: string;
  hostPinClear: string;
  hostPinUnlock: string;
  lockStage: string;
  videoStageMode: string;
  coverArtMode: string;
  enableAudioButton: string;
  enableAudioHint: string;
  nextUpLabel: string;
  noNextTrack: string;
  play: string;
  pause: string;
  skipNext: string;
  moveToTop: string;
  removeTrack: string;
  clearQueue: string;
  clearQueueConfirm: string;
  lockRequests: string;
  unlockRequests: string;
  requestsOpen: string;
  requestsClosed: string;
  scanToRequest: string;
  copyGuestLink: string;
  linkCopied: string;
  hostSettings: string;
  maxTracksPerGuest: string;
  newHostPin: string;
  pinUpdated: string;
  saveSettings: string;
  close: string;
  loadDemoTracks: string;
  demoTracksLoaded: string;
  videoRestrictedSkipping: string;
  trackSkipped: string;
  connectionError: string;
  shortcutsHint: string;
  fullscreen: string;
  exitFullscreen: string;
  playerFullscreen: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appName: "PartyQueue",
    demoModeBadge: "Demo Mode",
    liveModeBadge: "Live Sync",
    roomLabel: "Room",
    hostStageLink: "Host Stage",
    guestRemoteLink: "Guest Remote",
    nowPlayingOnMac: "Now Playing on Mac",
    nowPlaying: "Now Playing",
    playing: "Playing",
    paused: "Paused",
    nothingPlaying: "Stage is waiting for the first track",
    nothingPlayingHint: "Search YouTube or paste a link below to kick off the party.",
    requestedBy: "Requested by",
    youBadge: "You",
    upNext: "Up Next",
    queueEmptyGuest: "Queue is empty — be the DJ and add the next banger!",
    queueEmptyHost: "No tracks queued yet. Guests can scan the QR code to add songs.",
    sortFifo: "In Order (FIFO)",
    sortVotes: "Most Upvoted",
    searchTab: "Search YouTube",
    directLinkTab: "Paste Link",
    searchPlaceholder: "Search songs, artists, or paste a YouTube URL...",
    searchButton: "Search",
    searching: "Searching...",
    noSearchResults: "No embeddable videos found. Try another keyword or paste a direct link.",
    demoCatalogNotice: "Demo catalog active (no VITE_YOUTUBE_API_KEY). Direct YouTube links still fetch live via oEmbed!",
    directLinkPlaceholder: "https://youtube.com/watch?v=... or youtu.be/...",
    fetchLinkButton: "Preview Link",
    fetchingLink: "Fetching...",
    invalidYoutubeLink: "Please enter a valid YouTube or YouTube Music URL.",
    linkFetchFailed: "Could not load video details. Check the URL or embed availability.",
    addToQueue: "Add to Queue",
    adding: "Adding...",
    alreadyInQueue: "In Queue",
    addedToast: "Added to the party queue!",
    requestsLockedBanner: "The host has temporarily paused new song requests.",
    requestsLockedToast: "Song requests are currently locked by the host.",
    quotaBadge: "Your active slots",
    limitReachedToast: "You have reached the max active songs limit",
    nicknameTitle: "What should the party call you?",
    nicknameSubtitle: "Your nickname shows up on the big screen when your song plays.",
    nicknamePlaceholder: "Enter your nickname...",
    nicknameSave: "Join the Party",
    nicknameEdit: "Edit nickname",
    nicknameSuggestions: ["DJ Mint", "Beam", "Khao", "Alex", "Nook", "Party Star"],
    upvote: "Upvote",
    upvoted: "Upvoted",
    cancelRequest: "Remove",
    hostPinTitle: "Mac Host Stage",
    hostPinSubtitle: "Enter the 4-digit Host PIN to unlock playback & queue controls.",
    hostPinDefaultHint: "Default PIN: 0000 (configurable via VITE_HOST_PIN)",
    hostPinIncorrect: "Incorrect PIN. Try again.",
    hostPinClear: "Clear",
    hostPinUnlock: "Unlock Stage",
    lockStage: "Lock PIN",
    videoStageMode: "Video Stage",
    coverArtMode: "Ambient Art",
    enableAudioButton: "Start Party Audio",
    enableAudioHint: "macOS browsers require one click to enable unmuted party playback.",
    nextUpLabel: "Next Up",
    noNextTrack: "Add a track to keep the party rolling",
    play: "Play",
    pause: "Pause",
    skipNext: "Skip Next",
    moveToTop: "Move to Top",
    removeTrack: "Remove Track",
    clearQueue: "Clear Queue",
    clearQueueConfirm: "Clear all upcoming tracks from the queue?",
    lockRequests: "Lock Requests",
    unlockRequests: "Unlock Requests",
    requestsOpen: "Requests Open",
    requestsClosed: "Requests Locked",
    scanToRequest: "Scan to Request Songs",
    copyGuestLink: "Copy Guest Link",
    linkCopied: "Guest link copied!",
    hostSettings: "Stage Settings",
    maxTracksPerGuest: "Max active tracks per guest",
    newHostPin: "Change 4-digit Host PIN (this Mac)",
    pinUpdated: "Host PIN updated for this browser.",
    saveSettings: "Save Changes",
    close: "Close",
    loadDemoTracks: "Load Demo Party Mix",
    demoTracksLoaded: "Demo tracks added to queue!",
    videoRestrictedSkipping: "Video restricted by owner, skipping to next...",
    trackSkipped: "Skipped to next track.",
    connectionError: "Sync connection issue. Retrying automatically...",
    shortcutsHint: "Space: Play/Pause · Shift+N: Skip · F: Fullscreen",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit Fullscreen",
    playerFullscreen: "Fullscreen Player",
  },
  th: {
    appName: "PartyQueue",
    demoModeBadge: "โหมดทดลอง",
    liveModeBadge: "ซิงค์เรียลไทม์",
    roomLabel: "ห้อง",
    hostStageLink: "หน้าจอ Host",
    guestRemoteLink: "รีโมทแขก",
    nowPlayingOnMac: "กำลังเล่นบน Mac",
    nowPlaying: "กำลังเล่น",
    playing: "กำลังเล่น",
    paused: "หยุดชั่วคราว",
    nothingPlaying: "เวทีพร้อมแล้ว รอเพลงแรกของปาร์ตี้",
    nothingPlayingHint: "ค้นหาเพลง YouTube หรือวางลิงก์ด้านล่างเพื่อเริ่มความสนุก",
    requestedBy: "ขอโดย",
    youBadge: "คุณ",
    upNext: "คิวถัดไป",
    queueEmptyGuest: "ยังไม่มีเพลงในคิว — ส่งเพลงต่อไปได้เลย!",
    queueEmptyHost: "ยังไม่มีเพลงในคิว ให้เพื่อนสแกน QR Code เพื่อขอเพลงได้เลย",
    sortFifo: "เรียงตามคิว (FIFO)",
    sortVotes: "เรียงตามโหวตสูงสุด",
    searchTab: "ค้นหา YouTube",
    directLinkTab: "วางลิงก์เพลง",
    searchPlaceholder: "พิมพ์ชื่อเพลง ศิลปิน หรือวางลิงก์ YouTube...",
    searchButton: "ค้นหา",
    searching: "กำลังค้นหา...",
    noSearchResults: "ไม่พบวิดีโอที่เล่นแบบฝังได้ ลองคำค้นอื่นหรือวางลิงก์ตรง",
    demoCatalogNotice: "ใช้แคตตาล็อกทดลอง (ยังไม่มี VITE_YOUTUBE_API_KEY) แต่วางลิงก์ YouTube ตรงได้ทันทีผ่าน oEmbed!",
    directLinkPlaceholder: "https://youtube.com/watch?v=... หรือ youtu.be/...",
    fetchLinkButton: "ดึงข้อมูลเพลง",
    fetchingLink: "กำลังโหลด...",
    invalidYoutubeLink: "กรุณาวางลิงก์ YouTube หรือ YouTube Music ที่ถูกต้อง",
    linkFetchFailed: "ไม่สามารถดึงข้อมูลวิดีโอได้ กรุณาตรวจสอบลิงก์",
    addToQueue: "เพิ่มลงคิว",
    adding: "กำลังเพิ่ม...",
    alreadyInQueue: "อยู่ในคิวแล้ว",
    addedToast: "เพิ่มเพลงลงคิวปาร์ตี้แล้ว!",
    requestsLockedBanner: "Host ปิดรับการขอเพลงชั่วคราว",
    requestsLockedToast: "ขณะนี้ Host ล็อกการขอเพลงไว้ชั่วคราว",
    quotaBadge: "โควตาเพลงของคุณ",
    limitReachedToast: "คุณขอเพลงครบจำนวนสูงสุดที่ตั้งไว้แล้ว",
    nicknameTitle: "ตั้งชื่อเล่นสำหรับปาร์ตี้",
    nicknameSubtitle: "ชื่อเล่นของคุณจะโชว์บนจอใหญ่ตอนเพลงของคุณกำลังเล่น",
    nicknamePlaceholder: "พิมพ์ชื่อเล่นของคุณ...",
    nicknameSave: "เข้าสู่ปาร์ตี้",
    nicknameEdit: "เปลี่ยนชื่อเล่น",
    nicknameSuggestions: ["ดีเจมิ้นท์", "บีม", "ข้าว", "อเล็กซ์", "นุ๊ก", "สายตี้"],
    upvote: "โหวตขึ้น",
    upvoted: "โหวตแล้ว",
    cancelRequest: "ลบออก",
    hostPinTitle: "หน้าจอ Host (Mac Stage)",
    hostPinSubtitle: "ใส่รหัส PIN 4 หลักเพื่อปลดล็อกการควบคุมเพลงและคิว",
    hostPinDefaultHint: "รหัสเริ่มต้น: 0000 (ตั้งค่าได้ผ่าน VITE_HOST_PIN)",
    hostPinIncorrect: "รหัส PIN ไม่ถูกต้อง ลองใหม่อีกครั้ง",
    hostPinClear: "ล้าง",
    hostPinUnlock: "ปลดล็อกเวที",
    lockStage: "ล็อก PIN",
    videoStageMode: "โหมดวิดีโอ",
    coverArtMode: "โหมดปกเบลอ",
    enableAudioButton: "เริ่มเสียงปาร์ตี้",
    enableAudioHint: "เบราว์เซอร์บน macOS ต้องคลิก 1 ครั้งเพื่อเปิดเสียงอัตโนมัติ",
    nextUpLabel: "เพลงถัดไป",
    noNextTrack: "เพิ่มเพลงในคิวเพื่อเล่นต่อเนื่อง",
    play: "เล่น",
    pause: "หยุด",
    skipNext: "ข้ามเพลง",
    moveToTop: "ดันขึ้นคิวแรก",
    removeTrack: "ลบเพลง",
    clearQueue: "ล้างคิวทั้งหมด",
    clearQueueConfirm: "ต้องการล้างเพลงทั้งหมดในคิวถัดไปใช่หรือไม่?",
    lockRequests: "ล็อกการขอเพลง",
    unlockRequests: "เปิดรับขอเพลง",
    requestsOpen: "เปิดรับเพลง",
    requestsClosed: "ล็อกขอเพลง",
    scanToRequest: "สแกนเพื่อขอเพลง",
    copyGuestLink: "คัดลอกลิงก์แขก",
    linkCopied: "คัดลอกลิงก์แล้ว!",
    hostSettings: "ตั้งค่าเวที Host",
    maxTracksPerGuest: "จำนวนเพลงคิวสูงสุดต่อคน",
    newHostPin: "เปลี่ยนรหัส PIN 4 หลัก (เฉพาะเครื่องนี้)",
    pinUpdated: "อัปเดตรหัส PIN บนเบราว์เซอร์นี้แล้ว",
    saveSettings: "บันทึกการตั้งค่า",
    close: "ปิด",
    loadDemoTracks: "โหลดเพลงตัวอย่างปาร์ตี้",
    demoTracksLoaded: "เพิ่มเพลงตัวอย่างลงคิวแล้ว!",
    videoRestrictedSkipping: "วิดีโอนี้ถูกจำกัดการฝัง กำลังข้ามไปเพลงถัดไป...",
    trackSkipped: "ข้ามไปยังเพลงถัดไปแล้ว",
    connectionError: "การเชื่อมต่อสะดุด กำลังเชื่อมต่อใหม่อัตโนมัติ...",
    shortcutsHint: "Space: เล่น/หยุด · Shift+N: ข้ามเพลง · F: เต็มหน้าจอ",
    fullscreen: "เต็มหน้าจอ",
    exitFullscreen: "ออกจากเต็มจอ",
    playerFullscreen: "ขยายวิดีโอเต็มจอ",
  },
};
