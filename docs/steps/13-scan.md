## STEP 13 — Scan receipt QR  (branch `step/13-scan`)

**Goal:** the fastest, most polished moment of the app.
**State machine** (`useScanMachine`, tested): permission-unknown → permission-denied | scanning → resolving → success | error(code) | manual-entry.
**Layout:** full-bleed `CameraView` (QR only), **no photo behind, no white block** · top (inset): close IconButton, title "Çeki skan et" (white), torch IconButton · viewfinder 260×260 with the dim mask drawn by four 60% black rects (**no blur**), four white corner brackets, one thin brand-blue scan line moving (1800 ms loop) · pill under it: "QR kodu çərçivəyə yerləşdirin" · bottom: secondary pill "Kodu əllə daxil et".
**Permission:** pre-permission screen (camera icon, "Kameraya icazə lazımdır", "Çekin QR kodunu oxumaq üçün Epsilon-a kameradan istifadə icazəsi verin.", "İcazə ver"); if denied: "Ayarları aç" (open settings) + ghost "Kodu əllə daxil et".
**Handling:** accept only the first read then lock; pause the camera on success/error; stop it when unfocused or backgrounded. Client checks only: non-empty, length ≤ 2048 (SEC-7: never parse or open it). Send the raw payload: `ReceiptService.resolve({kind:"qr"|"code", value})`. resolving: pill "Yoxlanılır…". Success: corners turn green, check pops (spring 0.6→1), success haptic, after 400 ms `router.replace('/receipt/<id>')`.
**Errors** (card slides up 260 ms, "Yenidən skan et" + ghost "Bağla"): UNSUPPORTED "Bu QR kod dəstəklənmir" / "Yalnız Epsilon partnyor restoranlarının çekləri qəbul olunur." · ALREADY_CLAIMED "Bu çek artıq istifadə olunub" / "Hər çeki yalnız bir dəfə qiymətləndirmək olar." · EXPIRED "Çekin müddəti bitib" / "Bu çeki artıq qiymətləndirmək mümkün deyil." · NOT_FOUND "Çek tapılmadı" / "Kodu yoxlayıb yenidən cəhd edin." · NETWORK "İnternet bağlantısı yoxdur" / "Bağlantını yoxlayın və yenidən cəhd edin." · UNKNOWN "Nəsə səhv getdi" / "Bir az sonra yenidən cəhd edin."
**Manual entry:** Sheet with Input "Çek kodu" (uppercase, no spaces, 6–32 chars) + "Davam et".

**Micro-steps:** 13.a state machine (+ tests) · 13.b permission screens · 13.c camera + overlay + scan line · 13.d resolve call + success/lock · 13.e error cards · 13.f manual-entry sheet · 13.g lifecycle (focus/background) + a11y.

**MANUAL CHECK (real phone):** camera visible within ~400 ms; repeated scans don't fire multiple requests; works with permission granted, denied and revoked in Settings.

---
