// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Client } = require("pg");

const ustawienia = {
  adres:        "ul. Choszczeńska 85a, 73-220 Drawno",
  adresLink:    "https://rozgrywki.zzpn.pl/league/17/table",
  telefon:      "691 901 479",
  telefonOpis:  "Prezes – Jakub Zygała",
  emailKlub:    "drawa.drawno@zzpn.pl",
  emailPrezes:  "jakub.zygala05@o2.pl",
  facebook:     "https://www.facebook.com/profile.php?id=100031740656452",
  instagram:    "https://www.instagram.com/mksdrawadrawno/",
  liga:         "A klasa",
  ligaLink:     "https://rozgrywki.zzpn.pl/league/17/table",
  ligaSezon:    "2025/26",
};

const zarzad = [
  { rola: "Prezes",      imie: "Jakub Zygała",       telefon: "691 901 479",  email: "jakub.zygala05@o2.pl", kolejnosc: 0 },
  { rola: "Wiceprezes",  imie: "Ewelina Krykwińska", telefon: "696 541 071",  email: null,                   kolejnosc: 1 },
  { rola: "Sekretarz",   imie: "Szymon Filipowicz",  telefon: null,           email: null,                   kolejnosc: 2 },
  { rola: "Skarbnik",    imie: "Adrian Michalski",   telefon: null,           email: null,                   kolejnosc: 3 },
];

async function main() {
  const client = new Client({ connectionString: "postgresql://drawa:Freeasahorse1423@localhost:5432/drawa_fc" });
  await client.connect();

  // Ustawienia - upsert
  for (const [klucz, wartosc] of Object.entries(ustawienia)) {
    await client.query(
      `INSERT INTO "Ustawienie" (klucz, wartosc, "updatedAt") VALUES ($1,$2,NOW())
       ON CONFLICT (klucz) DO UPDATE SET wartosc=$2, "updatedAt"=NOW()`,
      [klucz, wartosc]
    );
    console.log(`Ustawienie: ${klucz} = ${wartosc}`);
  }

  // Zarząd - wstaw jeśli brak
  for (const o of zarzad) {
    const ex = await client.query(`SELECT id FROM "ZarzadOsoba" WHERE imie=$1`, [o.imie]);
    if (ex.rows.length > 0) { console.log(`SKIP zarząd: ${o.imie}`); continue; }
    await client.query(
      `INSERT INTO "ZarzadOsoba" (id, rola, imie, telefon, email, kolejnosc, aktywny, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,true,NOW(),NOW())`,
      [o.rola, o.imie, o.telefon, o.email, o.kolejnosc]
    );
    console.log(`Zarząd: ${o.rola} – ${o.imie}`);
  }

  console.log("\nGotowe!");
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
