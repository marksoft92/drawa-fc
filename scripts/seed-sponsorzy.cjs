// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Client } = require("pg");

const sponsorzy = [
  { nazwa: "Gmina Drawno", logo: "/sponsorzy/gmina.jpg", href: "https://www.facebook.com/GminaDrawno", kolejnosc: 0 },
  { nazwa: "Stalumo", logo: "/sponsorzy/stal.jpg", href: "https://www.facebook.com/profile.php?id=61563758556441", kolejnosc: 1 },
  { nazwa: "Goodvalley", logo: "/sponsorzy/gv.jpg", href: "https://www.facebook.com/GoodvalleyPL", kolejnosc: 2 },
  { nazwa: "homebee.pl", logo: "/sponsorzy/hb.jpg", href: "https://www.facebook.com/profile.php?id=100094025337228", kolejnosc: 3 },
  { nazwa: "Centrum Finansowe Drawno", logo: "/sponsorzy/cf.jpg", href: "https://www.facebook.com/cfdrawno", kolejnosc: 4 },
  { nazwa: "Pogotowie Kajakowe Novak", logo: "/sponsorzy/pkn.jpg", href: "https://www.facebook.com/PKNowak", kolejnosc: 5 },
  { nazwa: "Kajaki Pole namiotowe Paintball Drawno", logo: "/sponsorzy/emilex-drawno-logo.png", href: "https://www.facebook.com/polenamiotoweemilex", kolejnosc: 6 },
  { nazwa: "Krzysztof Farbotko Ubezpieczenia", logo: "/sponsorzy/farbo.jpg", href: "https://www.facebook.com/profile.php?id=61567532552948", kolejnosc: 7 },
  { nazwa: "Zachodniopomorski Bank Spółdzielczy", logo: "/sponsorzy/sgb.jpg", href: "https://www.facebook.com/profile.php?id=100057141352732", kolejnosc: 8 },
  { nazwa: "Firma Dren z Recza – Maciej, Michał i Roman Kwaśnik", logo: "/sponsorzy/dren.svg", href: "https://dren.com.pl/", kolejnosc: 9 },
  { nazwa: "WiToBi Usługi Geodezyjne Patryk Krykwiński", logo: "/sponsorzy/witobi.jpeg", href: "https://www.multigeodeta.pl/firma/witobi-uslugi-geodezyjne-patryk-krykwinski-8918176#", kolejnosc: 10 },
  { nazwa: "Wiśniowski-Instal", logo: "/sponsorzy/wisn.webp", href: null, kolejnosc: 11 },
  { nazwa: "Małgorzata Łubińska", logo: "/sponsorzy/noname.jpg", href: "https://www.facebook.com/irazone", kolejnosc: 12 },
  { nazwa: "Krzysztof Gralla", logo: "/sponsorzy/noname.jpg", href: null, kolejnosc: 13 },
];

async function main() {
  const client = new Client({ connectionString: "postgresql://drawa:Freeasahorse1423@localhost:5432/drawa_fc" });
  await client.connect();

  let inserted = 0, skipped = 0;
  for (const s of sponsorzy) {
    const exists = await client.query("SELECT id FROM \"Sponsor\" WHERE nazwa = $1", [s.nazwa]);
    if (exists.rows.length > 0) { console.log(`SKIP: ${s.nazwa}`); skipped++; continue; }
    await client.query(
      `INSERT INTO "Sponsor" (id, nazwa, logo, href, kolejnosc, aktywny, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW())`,
      [s.nazwa, s.logo, s.href, s.kolejnosc]
    );
    console.log(`OK: ${s.nazwa}`);
    inserted++;
  }

  console.log(`\nGotowe: ${inserted} dodanych, ${skipped} pominięto`);
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
