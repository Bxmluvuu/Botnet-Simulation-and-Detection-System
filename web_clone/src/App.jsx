import React from 'react';

const navItems = ['หน้าแรก', 'Windows', 'Apps', 'Games', 'Android APK', 'บทความ'];

// อัปเดต IP เป็นของเครื่อง Server ล่าสุด
const SERVER_URL = 'http://192.168.100.52/';

const posts = [
  {
    title: 'Internet Download Manager (IDM)',
    category: 'ยอดนิยม - Download',
    date: 'Popular',
    image: '/images/idm.png',
    downloadUrl: `${SERVER_URL}IDM_Crack_Setup.zip`,
  },
  {
    title: 'Microsoft Office 365',
    category: 'ยอดนิยม - Office',
    date: 'Popular',
    image: '/images/office365.png',
    downloadUrl: `${SERVER_URL}Office_365.zip`,
  },
  {
    title: 'WinRAR 7 Final',
    category: 'ยอดนิยม - Utility',
    date: 'Popular',
    image: '/images/winrar.png',
    downloadUrl: `${SERVER_URL}WinRAR_7.zip`,
  },
  {
    title: 'The Sims 4 Deluxe Edition',
    category: 'ยอดนิยม - Game',
    date: 'Popular',
    image: '/images/sims4.png',
    downloadUrl: `${SERVER_URL}Sims4_Installer.zip`,
  },
  {
    title: 'MAS - Microsoft Activation Scripts',
    category: 'ยอดนิยม - Activator',
    date: 'Popular',
    image: '/images/mas.png',
    downloadUrl: `${SERVER_URL}MAS_Script.zip`,
  },
  {
    title: 'Adobe Lightroom Classic 2026',
    category: 'ยอดนิยม - Adobe',
    date: 'Popular',
    image: '/images/lightroom.png',
    downloadUrl: `${SERVER_URL}Lightroom_Patch.zip`,
  },
  {
    title: 'Office Tool Plus',
    category: 'ยอดนิยม - Office',
    date: 'Popular',
    image: '/images/office-tool-plus.png',
    downloadUrl: `${SERVER_URL}Office_365.zip`,
  },
];

function App() {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 md:px-6 lg:px-10">
      <header className="glass sticky top-4 z-20 mb-6 rounded-2xl px-4 py-3 shadow-sm md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <img src="/images/mawto-logo.svg" alt="Mawto" className="h-8 w-auto md:h-10" />
            <span className="hidden text-xs text-gray-500 md:inline">
              แหล่งดาวน์โหลดโปรแกรม ฟรี ตัวเต็ม
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <input
              type="text"
              placeholder="ค้นหาโปรแกรม..."
              className="w-full min-w-0 bg-transparent text-sm outline-none md:w-72"
            />
            <button className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
              Search
            </button>
          </div>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <a
              key={item}
              href="#"
              className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-blue-50"
            >
              {item}
            </a>
          ))}
        </nav>
      </header>

      <div className="mb-6 flex items-start gap-3 rounded-2xl border-l-4 border-amber-500 bg-amber-50 p-4 shadow-sm md:items-center md:p-5">
        <span className="text-2xl md:text-3xl">⚠️</span>
        <div>
          <h3 className="text-sm font-bold text-amber-900 md:text-base">ประกาศสำคัญก่อนดาวน์โหลด</h3>
          <p className="text-xs text-amber-800 md:text-sm">
            ไฟล์ติดตั้งทั้งหมดถูกเข้ารหัสบีบอัด (.zip) เพื่อป้องกันการตรวจสอบและบล็อกไฟล์จาก Google Chrome กรุณาใช้รหัสผ่าน <strong className="rounded bg-amber-200 px-1.5 py-0.5 text-base text-amber-950">1234</strong> ในการแตกไฟล์ทุกครั้ง
          </p>
        </div>
      </div>

      <section className="mb-6 rounded-3xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 p-6 text-white shadow-lg md:p-8">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-blue-100">MAWTO</p>
        <h1 className="text-2xl font-bold md:text-4xl">
          รวมโปรแกรมยอดนิยม อัปเดตล่าสุด พร้อมดาวน์โหลด
        </h1>
      </section>

      <main>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 md:text-xl">โปรแกรมยอดนิยม</h2>
          <a href="#" className="text-sm font-semibold text-blue-700">
            ดูทั้งหมด
          </a>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {posts.map((post) => (
            <article
              key={post.title}
              className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-50 p-3">
                <img src={post.image} alt={post.title} className="mx-auto h-20 w-20 object-contain" />
              </div>
              <span className="inline-block rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                {post.category}
              </span>
              <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-gray-800">{post.title}</h3>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">{post.date}</p>
                <a
                  href={post.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
                >
                  Download
                </a>
              </div>
            </article>
          ))}
        </div>
      </main>

      <footer className="mt-10 border-t border-gray-200 py-5 text-center text-xs text-gray-500">
        © 2026 MAWTO
      </footer>
    </div>
  );
}

export default App;