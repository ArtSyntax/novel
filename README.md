# THE ECHO — Web Novel Reader
**แอปพลิเคชันอ่านนวนิยายออนไลน์เชิงโต้ตอบอย่างเป็นระบบของ "THE ECHO"**

[![Web App Status](https://img.shields.io/badge/Status-Production--Ready-brightgreen)](https://artsyntax.app/echo)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)
[![Framework](https://img.shields.io/badge/Frontend-Vanilla_JS_/_CSS3-blue)](app.js)

---

## 📖 เกี่ยวกับผลงาน (About the Novel)
**THE ECHO** นวนิยายแนว *Strategic Sci-Fi Rom-Com / Mind Games*
> *"ในโลกที่ความทรงจำสามารถลบและจัดสถาปัตยกรรมใหม่ได้ด้วยรหัสประสาท ธันย์ สถาปนิกสมองระดับแนวหน้าผู้ไร้อารมณ์ กลับสแกนเจอกลุ่มรหัสลับลบความจำซ้อนสามครั้งโดยมีลายเซ็นของตัวเขาเองในสมองของ นิ้ง ลูกค้าสาวสุดป่วนที่เขาไม่มีความทรงจำร่วมด้วยเลยแม้แต่เซกเมนต์เดียว เกมการไขปริศนาความจริงและสงครามหุ้นกู้พันล้านกับ Venture Capital ยักษ์ใหญ่จึงเริ่มต้นขึ้น!"*

---

## ✨ คุณลักษณะเด่นของแอปพลิเคชัน (Key Features)

*   **Single-Source-of-Truth Content Architecture:**
    ระบบดึงหัวข้อตอนมาทำสารบัญหน้าเว็บอัตโนมัติ โดยสแกนข้อมูลจากไฟล์วรรณกรรมดิบรูปฟอร์แมต Markdown (`.md`) ในโฟลเดอร์หลักโดยตรง ทำให้แก้ไขชื่อตอนในไฟล์เดียวแล้วอัปเดตไปที่หน้าเว็บทันที
*   **Dynamic Glossary & Hover Tooltips:**
    ระบบดักจับศัพท์เฉพาะทางประสาทวิทยาศาสตร์และไฮไลต์อัตโนมัติ โดยอ้างอิงฐานข้อมูลจาก [glossary.md](file:///Users/artthunder/ai_work/novel/echo/metadata/glossary.md) เมื่อผู้อ่านใช้คอมพิวเตอร์และเลื่อนเมาส์ชี้ (Hover) จะปรากฏกล่องคำอธิบายลอยตัวทันที
*   **Mobile-Optimized UX (Bottom Sheet Drawer):**
    ออกแบบรองรับการใช้งานผ่านมือถืออย่างสมบูรณ์แบบ โดยเปลี่ยนจากการชี้เมาส์มาเป็นการแตะ (Touch Tap) ซึ่งจะสไลด์แผงคำอธิบายขึ้นมาจากด้านล่างของจอภาพ (Bottom Sheet) พร้อมเอฟเฟกต์ฉากหลังเบลอ (Glassmorphism Backdrop Blur)
*   **Synchronized Global View Counter:**
    ระบบนับยอดผู้เข้าชมแบบเรียลไทม์ ซิงค์ตัวเลขชุดเดียวกันทุกเครื่องผ่านการเชื่อมต่อ **Counter API** พร้อมตัวเก็บข้อมูลแคชสำรองระดับเบราว์เซอร์ (`localStorage`) เพื่อความลื่นไหลยามเครือข่ายขัดข้อง
*   **Interactive Reader Controls & Styles:**
    *   ปรับระดับขนาดตัวอักษรได้อิสระ
    *   ระบบสลับธีมสีอ่านสบายตา 3 โหมด: **Sepia (ถนอมสายตา), Dark (โหมดมืด), Light (โหมดสว่าง)**
    *   แถบนำทางและ Drawer สารบัญด้านข้าง (Sidebar Drawer) ลื่นไหล
    *   ดีไซน์จัดหน้าชิดริมอย่างสมมาตร ไร้ปัญหาส่วนควบคุมล้นออกนอกขอบจอ (Viewport Safe)
*   **SEO & Crawler Optimized:**
    สร้างสิทธิ์การเข้าถึงแบบสากลและแผนผังเว็บไซต์รองรับ AI บอตและ Search Engine ผ่านการกำหนดค่าโดเมนหลัก `https://artsyntax.app/echo` ในไฟล์ [robots.txt](file:///Users/artthunder/ai_work/novel/robots.txt) และ [sitemap.xml](file:///Users/artthunder/ai_work/novel/sitemap.xml)

---

## 📁 โครงสร้างโฟลเดอร์โครงการ (Folder Structure)

```text
novel/
├── index.html           # โครงสร้างหน้าเว็บแอปพลิเคชันและหน้ากากแสดงผลหลัก
├── style.css            # สไตล์การจัดหน้า ดีไซน์ Responsive, ธีมสี และ Tooltips
├── app.js               # ระบบประมวลผล Markdown Parser, Glossary Engine และ API
├── LICENSE              # เอกสารประกาศสงวนลิขสิทธิ์และข้อตกลงใช้งานสากล
├── robots.txt           # สิทธิ์อนุญาตให้บอต AI และสแกนเนอร์เข้าเก็บข้อมูล
├── sitemap.xml          # แผนผังพิกัดบทเรียนในเว็บสำหรับ Search Engine
├── .gitignore           # ซ่อนไฟล์ขยะระบบ macOS (.DS_Store) จาก Git
└── echo/                # โฟลเดอร์จัดเก็บข้อมูลวรรณกรรมดิบและหน้าปก
    ├── cover_echo.jpg   # ภาพปกหน้านิยาย THE ECHO
    ├── chapters/        # ไฟล์วรรณกรรมแบ่งตอน chapter_1.md ถึง chapter_10.md
    └── metadata/        # คลังข้อมูลการวางพล็อตนิยายและไฟล์อธิบายศัพท์ glossary.md
```

---

## 🚀 วิธีการรันบนเครื่องตนเอง (How to Run Locally)

เนื่องจากเว็บแอปพลิเคชันเรียกใช้โปรโตคอล API ความปลอดภัยและการดึงไฟล์เนื้อหา Markdown ข้ามไฟล์ผ่าน AJAX (`fetch`) จึงต้องรันผ่าน Local HTTP Web Server (ห้ามเปิดไฟล์ HTML ตรง ๆ จากโฟลเดอร์)

1.  เปิด Terminal และชี้ที่ตั้งมายังโฟลเดอร์โครงการ:
    ```bash
    cd /Users/artthunder/ai_work/novel
    ```
2.  รันเซิร์ฟเวอร์แบบง่ายด้วย Python 3:
    ```bash
    python3 -m http.server 8000
    ```
3.  เปิดบราวเซอร์และเข้าสู่ระบบตามพิกัดลิงก์:
    `http://localhost:8000`

---

## 📄 ใบอนุญาตสิทธิ์และการเผยแพร่ (Copyright & License)
© 2026 artsyntax. สงวนสิทธิ์ตามพระราชบัญญัติลิขสิทธิ์ พ.ศ. 2537 (และที่แก้ไขเพิ่มเติม) รวมถึงอนุสัญญาระหว่างประเทศ ผลงานทั้งหมดรวมถึงโค้ดและนวนิยายเรื่องนี้ ได้รับการสงวนลิขสิทธิ์โดยเจ้าของผลงานแต่เพียงผู้เดียว โดยอนุญาตให้อ่านผ่านระบบของหน้าเว็บไซต์หลัก `https://artsyntax.app/echo` เท่านั้น ห้ามนำไปดัดแปลง คัดลอก หรือโฮสต์แสดงผลต่อบนแพลตฟอร์มอื่นภายนอกโดยไม่ได้รับความยินยอมเป็นลายลักษณ์อักษร ดูรายละเอียดเพิ่มเติมในไฟล์ [LICENSE](LICENSE)
