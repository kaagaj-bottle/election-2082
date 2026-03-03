"""Management command to populate English fields from Nepali text."""

from typing import Any

from django.core.management.base import BaseCommand

from app.apps.candidates.models import Candidate
from app.apps.elections.models import District, Province
from app.apps.parties.models import Party
from app.core.transliterate import transliterate

# Official English names for all 7 provinces
PROVINCE_NAMES: dict[int, str] = {
    1: "Koshi",
    2: "Madhesh",
    3: "Bagmati",
    4: "Gandaki",
    5: "Lumbini",
    6: "Karnali",
    7: "Sudurpashchim",
}

# Official English names for all 77 districts, keyed by Nepali name
DISTRICT_NAMES: dict[str, str] = {
    # Koshi Province
    "ताप्लेजुङ": "Taplejung",
    "पाँचथर": "Panchthar",
    "इलाम": "Ilam",
    "झापा": "Jhapa",
    "मोरङ": "Morang",
    "सुनसरी": "Sunsari",
    "धनकुटा": "Dhankuta",
    "तेह्रथुम": "Terhathum",
    "भोजपुर": "Bhojpur",
    "संखुवासभा": "Sankhuwasabha",
    "सोलुखुम्बु": "Solukhumbu",
    "ओखलढुङ्गा": "Okhaldhunga",
    "ओखलढुंगा": "Okhaldhunga",
    "खोटाङ": "Khotang",
    "उदयपुर": "Udayapur",
    # Madhesh Province
    "सप्तरी": "Saptari",
    "सिराहा": "Siraha",
    "धनुषा": "Dhanusha",
    "महोत्तरी": "Mahottari",
    "सर्लाही": "Sarlahi",
    "रौतहट": "Rautahat",
    "बारा": "Bara",
    "पर्सा": "Parsa",
    # Bagmati Province
    "दोलखा": "Dolakha",
    "सिन्धुपाल्चोक": "Sindhupalchok",
    "रामेछाप": "Ramechhap",
    "काभ्रेपलाञ्चोक": "Kavrepalanchok",
    "सिन्धुली": "Sindhuli",
    "मकवानपुर": "Makwanpur",
    "भक्तपुर": "Bhaktapur",
    "ललितपुर": "Lalitpur",
    "काठमाण्डौ": "Kathmandu",
    "काठमाडौँ": "Kathmandu",
    "काठमाडौं": "Kathmandu",
    "नुवाकोट": "Nuwakot",
    "रसुवा": "Rasuwa",
    "धादिङ": "Dhading",
    "चितवन": "Chitwan",
    # Gandaki Province
    "गोरखा": "Gorkha",
    "लमजुङ": "Lamjung",
    "तनहुँ": "Tanahun",
    "स्याङ्जा": "Syangja",
    "स्याङजा": "Syangja",
    "कास्की": "Kaski",
    "मनाङ": "Manang",
    "मुस्ताङ": "Mustang",
    "म्याग्दी": "Myagdi",
    "पर्वत": "Parbat",
    "बाग्लुङ": "Baglung",
    "नवलपरासी (बर्दघाट सुस्ता पूर्व)": "Nawalparasi East",
    # Lumbini Province
    "रुपन्देही": "Rupandehi",
    "रूपन्देही": "Rupandehi",
    "कपिलवस्तु": "Kapilvastu",
    "कपिलबस्तु": "Kapilvastu",
    "अर्घाखाँची": "Arghakhanchi",
    "गुल्मी": "Gulmi",
    "पाल्पा": "Palpa",
    "नवलपरासी (बर्दघाट सुस्ता पश्चिम)": "Nawalparasi West",
    "दाङ": "Dang",
    "प्यूठान": "Pyuthan",
    "रोल्पा": "Rolpa",
    "रुकुम (पूर्वी भाग)": "Rukum East",
    "बाँके": "Banke",
    "बर्दिया": "Bardiya",
    # Karnali Province
    "रुकुम पश्चिम": "Rukum West",
    "रुकुम (पश्चिमी भाग)": "Rukum West",
    "रुकुम (पश्चिम भाग)": "Rukum West",
    "सल्यान": "Salyan",
    "डोल्पा": "Dolpa",
    "हुम्ला": "Humla",
    "जुम्ला": "Jumla",
    "कालिकोट": "Kalikot",
    "मुगु": "Mugu",
    "सुर्खेत": "Surkhet",
    "दैलेख": "Dailekh",
    "जाजरकोट": "Jajarkot",
    # Sudurpashchim Province
    "कैलाली": "Kailali",
    "अछाम": "Achham",
    "डोटी": "Doti",
    "बझाङ": "Bajhang",
    "बाजुरा": "Bajura",
    "कञ्चनपुर": "Kanchanpur",
    "डडेलधुरा": "Dadeldhura",
    "बैतडी": "Baitadi",
    "दार्चुला": "Darchula",
}

# Official English names for all 66 parties, keyed by EC Nepali name.
# Used as authoritative override for ekantipur scrape and transliteration fallback.
PARTY_NAMES: dict[str, str] = {
    "नेपाल कम्युनिष्ट पार्टी (एकीकृत मार्क्सवादी लेनिनवादी)": "CPN (Unified Marxist-Leninist)",
    "नेपाली काँग्रेस": "Nepali Congress",
    "नेपाली कम्युनिष्ट पार्टी": "Communist Party of Nepal",
    "राष्ट्रिय स्वतन्त्र पार्टी": "Rastriya Swatantra Party",
    "राष्ट्रिय प्रजातन्त्र पार्टी": "Rastriya Prajatantra Party",
    "जनता समाजवादी पार्टी, नेपाल": "Janata Samajwadi Party, Nepal",
    "नेपाल कम्युनिस्ट पार्टी (माओवादी)": "Communist Party of Nepal (Maoist)",
    "राष्ट्रिय जनमोर्चा": "Rastriya Janamorcha",
    "जनमत पार्टी": "Janamat Party",
    "नागरिक उन्मुक्ति पार्टी, नेपाल(एकल चुनाव चिन्ह)": "Nagarik Unmukti Party, Nepal",
    "राष्ट्रिय जनता पार्टी नेपाल": "Rastriya Janata Party Nepal",
    "नेपाल मजदुर किसान पार्टी": "Nepal Majdoor Kisan Party",
    "श्रम संस्कृति पार्टी": "Shram Sanskriti Party",
    "राष्ट्रिय एकता दल": "Rastriya Ekta Dal",
    "स्वतन्त्र": "Independent",
    "लोकतान्त्रिक समाजवादी पार्टी, नेपाल": "Loktantrik Samajwadi Party, Nepal",
    "संघीय लोकतान्त्रिक राष्ट्रिय मञ्च": "Sanghiya Loktantrik Rastriya Manch",
    "नेपाल कम्युनिष्ट पार्टी (संयुक्त)": "CPN (United)",
    "नेपाल कम्युनिष्ट पार्टी मार्क्सवादी (पुष्पलाल)": "CPN Marxist (Pushpalal)",
    "नेपाल कम्युनिष्ट पार्टी (माक्र्सवादी)(एकल चुनाव चिन्ह)": "CPN (Marxist)",
    "राष्ट्रिय उर्जाशील पार्टी, नेपाल": "Rastriya Urjashil Party, Nepal",
    "राष्ट्रिय जनमत पार्टी": "Rastriya Janamat Party",
    "राष्ट्रिय जनमुक्ति पार्टी": "Rastriya Janamukti Party",
    "राष्ट्रिय परिवर्तन पार्टी": "Rastriya Pariwartan Party",
    "राष्ट्रिय साझा पार्टी": "Rastriya Sajha Party",
    "राष्ट्रिय मुक्ति आन्दोलन, नेपाल": "Rastriya Mukti Andolan, Nepal",
    "राष्ट्रिय मुक्ति पार्टी नेपाल(एकल चुनाव चिन्ह)": "Rastriya Mukti Party Nepal",
    " राष्ट्रिय नागरिक पार्टी": "Rastriya Nagarik Party",
    "राष्ट्र निर्माण दल नेपाल": "Rastra Nirman Dal Nepal",
    "नेपाल जनता पार्टी": "Nepal Janata Party",
    "नेपाल जनता संरक्षण पार्टी": "Nepal Janata Sanrakshan Party",
    "नेपाल जनमुक्ति पार्टी": "Nepal Janamukti Party",
    "नेपाल जनसेवा पार्टी": "Nepal Janasewa Party",
    "नेपाल मातृभूमि पार्टी": "Nepal Matribhumi Party",
    "नेपाल मानवतावादी पार्टी": "Nepal Manavtawadi Party",
    "नेपाल लोकतान्त्रिक पार्टी": "Nepal Loktantrik Party",
    "नेपाल संघीय समाजवादी पार्टी(एकल चुनाव चिन्ह)": "Nepal Sanghiya Samajwadi Party",
    "नेपाल सद्भावना पार्टी": "Nepal Sadbhawana Party",
    "नेपालका लागि नेपाली पार्टी": "Nepalka Lagi Nepali Party",
    "नेपाली जनता दल": "Nepali Janata Dal",
    "नेपाली जनश्रमदान संस्कृति पार्टी": "Nepali Janashramdan Sanskriti Party",
    "नेशनल रिपब्लिक नेपाल": "National Republic Nepal",
    "पिपुल फर्ष्ट पार्टी": "People First Party",
    "प्रगतिशील लोकतान्त्रिक पार्टी": "Pragatishil Loktantrik Party",
    "प्रजातान्त्रिक पार्टी नेपाल": "Prajatantrik Party Nepal",
    "आम जनता पार्टी(एकल चुनाव चिन्ह)": "Aam Janata Party",
    "इतिहासिक जनता पार्टी": "Itihasik Janata Party",
    "उज्यालो नेपाल पार्टी": "Ujyalo Nepal Party",
    "गतिशील लोकतान्त्रिक पार्टी": "Gatishil Loktantrik Party",
    "गान्धीवादी पार्टी नेपाल": "Gandhiwadi Party Nepal",
    "जन अधिकार पार्टी": "Jan Adhikar Party",
    "जनता लोकतान्त्रिक पार्टी, नेपाल": "Janata Loktantrik Party, Nepal",
    "जनता समाजवादी पार्टी(एकल चुनाव चिन्ह)": "Janata Samajwadi Party",
    "जनादेश पार्टी नेपाल(एकल चुनाव चिन्ह)": "Janadesh Party Nepal",
    "जय मातृभूमि पार्टी": "Jai Matribhumi Party",
    "त्रिमूल नेपाल": "Trimool Nepal",
    "नागरिक सर्वोच्चता पार्टी नेपाल(एकल चुनाव चिन्ह)": "Nagarik Sarvochata Party Nepal",
    "बहुजन एकता पार्टी नेपाल(एकल चुनाव चिन्ह)": "Bahujan Ekta Party Nepal",
    "बहुजन शक्ति पार्टी": "Bahujan Shakti Party",
    "मंगोल नेशनल अर्गनाइजेसन": "Mongol National Organisation",
    "मितेरी पार्टी नेपाल": "Miteri Party Nepal",
    "युनाईटेड नेपाल डिमोक्रयाटीक पार्टी": "United Nepal Democratic Party",
    "संयुक्त नागरिक पार्टी": "Sanyukta Nagarik Party",
    "समावेशी समाजवादी पार्टी": "Samabeshi Samajwadi Party",
    "समावेशी समाजवादी पार्टी नेपाल": "Samabeshi Samajwadi Party Nepal",
    "सार्वभौम नागरिक पार्टी": "Sarvabhaum Nagarik Party",
    "स्वाभिमान पार्टी": "Swabhiman Party",
}

# English names for all 144 election symbols, keyed by Nepali SymbolName
SYMBOL_NAMES: dict[str, str] = {
    "रुख": "Tree",
    "सुर्य": "Sun",
    "पाँचकुने तारा": "Five-Pointed Star",
    "घण्टी": "Bell",
    "हलो": "Plough",
    "गोलो घेराभित्र दुई पात भएको गुलाफको फूल": "Rose with Two Leaves inside a Circle",
    "मादल": "Madal",
    "कुखुराको भाले": "Rooster",
    "अँजुलीमा रहेको माटो": "Soil in Cupped Hands",
    "बलिरहेको बिजुलीको चिम": "Burning Light Bulb",
    "मोबाइल": "Mobile Phone",
    "ढल्केको छाता": "Tilted Umbrella",
    "खुलेको एकल आँखा": "Single Open Eye",
    "चकिया (जाँतो)": "Grinding Stone",
    "गिलास": "Glass",
    "आँप": "Mango",
    "लाउड स्पिकर": "Loudspeaker",
    "कैंची": "Scissors",
    "क्यामरा": "Camera",
    "मुढा": "Stool",
    "उडिरहेको माहुरी": "Flying Bee",
    "जीप": "Jeep",
    "त्रिभुज": "Triangle",
    "क्याप": "Cap",
    "सिरिन्ज": "Syringe",
    "हँसिया": "Sickle",
    "चेसगोटी": "Chess Piece",
    "कप र प्लेट": "Cup and Saucer",
    "झोला": "Bag",
    "भँगेरा": "Sparrow",
    "घोडा": "Horse",
    "व्याडमिन्टन कर्क": "Badminton Shuttlecock",
    "दूरबिन": "Binoculars",
    "प्रेसर कुकर": "Pressure Cooker",
    "ट्रफी": "Trophy",
    "हेल्मेट": "Helmet",
    "पंखा": "Fan",
    "क्याल्कुलेटर": "Calculator",
    "दाप सहितको खुकुरी": "Khukuri with Sheath",
    "मसी": "Ink Pot",
    "गितार": "Guitar",
    "रिक्सा": "Rickshaw",
    "स्टुल": "Stool",
    "कमलको फूल": "Lotus Flower",
    "घर": "House",
    "केबल कार": "Cable Car",
    "बाँसुरी": "Flute",
    "हात मिलाएको": "Handshake",
    "काउली": "Cauliflower",
    "बस": "Bus",
    "आँखीझ्याल": "Window",
    "काखमा बच्चा लिएको आमा": "Mother Carrying Baby",
    "तिलहरी": "Tilhari",
    "गोलो घेराभित्र पानीको बोतल": "Water Bottle inside a Circle",
    "आरी": "Saw",
    "सारङ्\u200cगी": "Sarangi",
    "नरिवल": "Coconut",
    "पेट्रोल पम्प": "Petrol Pump",
    "बाकस": "Box",
    "ढिकी": "Dhiki",
    "फिरफिरे": "Pinwheel",
    "पानीको जार": "Water Jar",
    "ठेकी": "Theki",
    "आसकोट": "Coat",
    "गोलाकार भित्र शङ्\u200cख": "Conch Shell inside a Circle",
    "टि टेवल": "Tea Table",
    "केराको काइँयो": "Banana Bunch",
    "ग्याँस चुलो": "Gas Stove",
    "खाम": "Envelope",
    "डस्ट बिन": "Dustbin",
    "टायर": "Tyre",
    "सोफा": "Sofa",
    "हारमोनियम": "Harmonium",
    "सेलरोटी": "Sel Roti",
    "फर्सी": "Pumpkin",
    "सेतो र कालो रङगको जुत्ता": "Black and White Shoe",
    "पाण्डा": "Panda",
    "श्रीवत्स समृद्धिको प्रतीक": "Shrivatsa Symbol of Prosperity",
    "गाढा निलो कलरको गोलाकार भित्र 24 किलाको चक्र": "24-Spoke Wheel inside Dark Blue Circle",
    "स्प्रे": "Spray",
    "डुङ्\u200cगा": "Boat",
    "अनार": "Pomegranate",
    "इनार": "Well",
    "दुई हात जोडेको नमस्कार": "Namaste",
    "सिट्ठी": "Whistle",
    "तुलसी, मठ": "Tulsi Plant with Platform",
    "हजारी": "Marigold",
    "पेन्चिस": "Pliers",
    "माना पाथी": "Mana Pathi",
    "खसीको टाउको": "Goat Head",
    "गैँती": "Pickaxe",
    "जुवा": "Yoke",
    "मुसो": "Pestle",
    "भैँसी": "Buffalo",
    "नट बोल्ट": "Nut and Bolt",
    "ऊँट": "Camel",
    "गुलेली": "Slingshot",
    "गमबुट": "Gumboot",
    "बुल्डोजर": "Bulldozer",
    "दुई औला खुलेको तिन औला बन्द भएको हातको आकृति": "Hand with Two Fingers Open",
    "चापाकल (ट्\u200dयुवेल)": "Hand Pump",
    "जगर भएको सिंह": "Maned Lion",
    "डोको": "Doko",
    "जग": "Jug",
    "हाते पंखा": "Hand Fan",
    "बदेल": "Wild Boar",
    "सेफ्टी पिन": "Safety Pin",
    "स्टाप्लर": "Stapler",
    "पानीको फिल्टर": "Water Filter",
    "कङ्\u200cगारु": "Kangaroo",
    "षटकोण": "Hexagon",
    "ब्याट्री": "Battery",
    "रथ": "Chariot",
    "ओदान": "Ladle",
    "झ्याली": "Cymbal",
    "मान्छेले काधमा बोकिराखेको ढुङ्\u200cगा": "Man Carrying Stone on Shoulder",
    "ह्विल चेयर": "Wheelchair",
    "भित्ते घडी": "Wall Clock",
    "ज्यावेल": "Trowel",
    "बकुल्लो": "Owl",
    "बाली बोकेको महिलाको आकृति": "Woman Carrying Crops",
    "बेलना र चक्ला": "Rolling Pin and Board",
    "जाली": "Net",
    "पन्चिङ मेसिन": "Punching Machine",
    "हेडफोन": "Headphones",
    "पुरुष": "Man",
    "बिरालो": "Cat",
    "चुलेसी": "Chulesi",
    "ड्रम सेट": "Drum Set",
    "हटकेस": "Suitcase",
    "पञ्जा छाप": "Paw Print",
    "ढाका टोपी": "Dhaka Topi",
    "ह्याङ्गर": "Hanger",
    "ट्रयाक्टर": "Tractor",
    "इस्त्री": "Iron",
    "नेलकटर": "Nail Cutter",
    "दायाँ हातले समातेको मसाल": "Torch Held in Right Hand",
    "कोदालो": "Hoe",
    "सिलौटो": "Grinding Slab",
    "चङ्\u200cगा": "Kite",
    "बलिरहेको दियो": "Burning Oil Lamp",
    "भेडा": "Sheep",
    "शङ्खे किरा": "Snail",
    "भ्यागुता": "Frog",
}

# Canonical English names for common Nepali qualification variants.
# Maps the most frequent Nepali/mixed-language spellings to a normalized form.
QUALIFICATION_NAMES: dict[str, str] = {
    # Literate / basic
    "साक्षर": "Literate",
    "साक्षर ": "Literate",
    "साक्षरता": "Literate",
    "लेखपढ": "Literate",
    "साधारण लेखपढ": "Basic Literate",
    "साधारण लेखपढ ": "Basic Literate",
    "साधरण लेखपढ": "Basic Literate",
    "सधारण लेखपढ": "Basic Literate",
    "सामान्य लेखपढ": "Basic Literate",
    "साधारण": "Basic Literate",
    "साधरण": "Basic Literate",
    "सधारण": "Basic Literate",
    "सामान्य": "Basic Literate",
    "सामान्य ": "Basic Literate",
    "निरक्षर": "Illiterate",
    "छैन": "None",
    # SLC / SEE variants (Nepali)
    "एस.एल.सी.": "SLC",
    "एस.एल.सी": "SLC",
    "एस.एल.सी ": "SLC",
    "एस एल सी": "SLC",
    "एस एल सी ": "SLC",
    "एसएलसी": "SLC",
    "एसएलसी ": "SLC",
    "एस.एल.सि.": "SLC",
    "एस.एल.सि": "SLC",
    "एस.एल.सि. ": "SLC",
    "एस एल सि": "SLC",
    "एस. एल. सी.": "SLC",
    "एस.एस.सी. पास": "SLC",
    "एस.एस.सी. ": "SLC",
    "एस.एल.सि.पास": "SLC",
    "एस एल सि पास": "SLC",
    "प्रवेशिका": "SLC",
    "दश कक्षा": "SLC",
    "टेष्ट पास": "Test Pass",
    # SLC / SEE variants (English)
    "SLC": "SLC",
    "SLC ": "SLC",
    " SLC": "SLC",
    "slc": "SLC",
    "sLC": "SLC",
    "sLc": "SLC",
    "S.L.C.": "SLC",
    "S.L.C": "SLC",
    "s.l.c.": "SLC",
    "s.l.c": "SLC",
    "SLC पास": "SLC",
    "SLC PASS": "SLC",
    "SLC pass": "SLC",
    "slc pass": "SLC",
    "under slc": "Under SLC",
    "SEE": "SEE",
    "see": "SEE",
    # Grade/class levels (Nepali)
    "१० पास": "Grade 10",
    "१० पास ": "Grade 10",
    "१० कक्षा": "Grade 10",
    "१० कक्षा पास": "Grade 10",
    "कक्षा १०": "Grade 10",
    "कक्षा 10": "Grade 10",
    "10": "Grade 10",
    "१०": "Grade 10",
    "10 pass": "Grade 10",
    "10 पास": "Grade 10",
    "१२ पास": "Grade 12",
    "१२": "Grade 12",
    "12": "Grade 12",
    "12 pass": "Grade 12",
    "12 pass ": "Grade 12",
    "12 पास": "Grade 12",
    "12 उत्तीर्ण": "Grade 12",
    "कक्षा १२ पास": "Grade 12",
    "८ पास": "Grade 8",
    "८ कक्षा": "Grade 8",
    "८ कक्षा पास": "Grade 8",
    "8": "Grade 8",
    "8 pass": "Grade 8",
    "8 पास": "Grade 8",
    "8 कक्षा": "Grade 8",
    "कक्षा ८": "Grade 8",
    "९ पास": "Grade 9",
    "९ कक्षा": "Grade 9",
    "९ कक्षा पास": "Grade 9",
    "कक्षा ९": "Grade 9",
    "९": "Grade 9",
    "7": "Grade 7",
    "कक्षा ५ पास": "Grade 5",
    "प्राथमिक शिक्षा": "Primary Education",
    "आधारभुत तह": "Basic Level",
    "माध्यमिक तह": "Secondary Level",
    "माध्यामिक तह": "Secondary Level",
    "उच्च मा वि": "Higher Secondary",
    # +2 / Intermediate variants
    "+2": "+2",
    "+2 ": "+2",
    "+२": "+2",
    "\u200c+2": "+2",
    "+ 2": "+2",
    "+12": "+2",
    "१०+२": "+2",
    "10+2": "+2",
    "10+2 ": "+2",
    "+2 पास": "+2",
    "+२ पास": "+2",
    "+2 pass": "+2",
    "+2 passed": "+2",
    "10+2 pass": "+2",
    "प्लस टु": "+2",
    "प्लस टु पास": "+2",
    "HSEB": "+2",
    "hseb": "+2",
    # IA / Intermediate
    "आई.ए.": "IA",
    "आई.ए": "IA",
    "आई ए": "IA",
    "आइ.ए.": "IA",
    "आइ. ए.": "IA",
    "आइ ए": "IA",
    "आ.ए": "IA",
    "IA": "IA",
    "I.A.": "IA",
    "I.A": "IA",
    "आई.ए.सी.": "IA",
    "आई.एल.": "IL",
    "आइ एल": "IL",
    "I L": "IL",
    "I.Sc.": "I.Sc.",
    "ISC": "I.Sc.",
    "आई कम": "I.Com",
    "I.Com": "I.Com",
    # Proficiency Certificate
    "प्रविणता प्रमाणपत्र तह": "Proficiency Certificate",
    "प्रविणता प्रमाणपत्र": "Proficiency Certificate",
    "प्रविणता प्रमाण पत्र तह": "Proficiency Certificate",
    "प्रविणता प्रमाण पत्र": "Proficiency Certificate",
    "प्रविणता तह": "Proficiency Certificate",
    "प्रमाणपत्र तह": "Certificate Level",
    "प्रमाण पत्र तह": "Certificate Level",
    # Bachelor's variants (Nepali)
    "स्नातक": "Bachelor's",
    "स्नातक ": "Bachelor's",
    "स्\u200dनातक": "Bachelor's",
    "स्\u200dनातक ": "Bachelor's",
    "स्नातक तह": "Bachelor's",
    "स्नातक तह ": "Bachelor's",
    "स्\u200dनातक तह": "Bachelor's",
    "स्नातकतह": "Bachelor's",
    "व्याचलर": "Bachelor's",
    "कानूनमा स्नातक": "Bachelor's in Law",
    # Bachelor's variants (English)
    "Bachelor": "Bachelor's",
    "bachelor": "Bachelor's",
    "BA": "BA",
    "B.A.": "BA",
    "B.A": "BA",
    "बि.ए.": "BA",
    "बि.ए": "BA",
    "वि.ए.": "BA",
    "वि ए": "BA",
    "BBS": "BBS",
    "B.Ed.": "B.Ed.",
    "B.ED": "B.Ed.",
    "B.ed": "B.Ed.",
    "बि.एड": "B.Ed.",
    "वि.एड.": "B.Ed.",
    "वि.एड": "B.Ed.",
    "B.COM": "B.Com",
    "B.com": "B.Com",
    "BE": "BE",
    "B.Tech": "B.Tech",
    "BBA": "BBA",
    "BALLB": "BA LLB",
    "BA LLB": "BA LLB",
    "उच्च शिक्षा": "Higher Education",
    # Master's variants (Nepali)
    "स्नातकोत्तर": "Master's",
    "स्नातकोत्तर ": "Master's",
    "स्\u200dनातकोत्तर": "Master's",
    "स्\u200dनातकोत्तर ": "Master's",
    "स्नाकोत्तर": "Master's",
    "स्नाकोत्तर ": "Master's",
    "स्\u200dनाकोत्तर": "Master's",
    "स्नातकोतर": "Master's",
    "स्नातकोक्तर": "Master's",
    "स्नातकोउत्तर": "Master's",
    "स्नात्तकोत्तर": "Master's",
    "स्\u200dनात्तकोतर": "Master's",
    "स्\u200dनात्तकोत्तर": "Master's",
    "स्तानकोत्तर": "Master's",
    "मास्टर डिग्री": "Master's",
    # Master's variants (English)
    "MA": "MA",
    "M.A.": "MA",
    "M.A": "MA",
    "एम.ए.": "MA",
    "एम.ए": "MA",
    "एम ए": "MA",
    "एम. ए.": "MA",
    "Master": "Master's",
    "master": "Master's",
    "Masters": "Master's",
    "masters": "Master's",
    "Master Degree": "Master's",
    "MBS": "MBS",
    "MBA": "MBA",
    "MA LLB": "MA LLB",
    "एम एड": "M.Ed.",
    "एम.एड.": "M.Ed.",
    "med": "M.Ed.",
    # LLB / Law
    "एल.एल.बि.": "LLB",
    "एल.एल.सि.": "LLB",
    # PhD variants
    "पि.एच.डि.": "PhD",
    "पि.एच.डी": "PhD",
    "पि.एच.डी.": "PhD",
    "विद्यावारिधी": "PhD",
    "विद्यावारिधि": "PhD",
    "विद्यावारीधी": "PhD",
    "बिध्यावारिधी": "PhD",
    "PHD": "PhD",
    "PHD ": "PhD",
    "P.hd": "PhD",
    "MBBS": "MBBS",
    # Diploma / Engineering
    "डिप्लोमा": "Diploma",
    "डिप्लोमा इन्जिनियरिङ्ग": "Diploma in Engineering",
    "इन्जिनियर": "Engineer",
    "इन्जिनियरीङ्ग": "Engineering",
    # Other English
    "Y": "Literate",
    "H.A": "HA",
    "I.ed pass ": "I.Ed.",
    "आई एड": "I.Ed.",
    "आई.एड.": "I.Ed.",
}

# Canonical English names for the most common institution name variants.
# Covers Tribhuvan University (~350 records), boards, and other frequent institutions.
INSTITUTION_NAMES: dict[str, str] = {
    # Tribhuvan University variants
    "त्रिभुवन विश्वविद्यालय": "Tribhuvan University",
    "त्रिभुवन विश्वविद्यालय ": "Tribhuvan University",
    "त्रिभुवन विश्व विद्यालय": "Tribhuvan University",
    "त्रिभुवन विश\u200dवविद्यालय": "Tribhuvan University",
    "त्रिभुवन विश्\u200dवविद्यालय": "Tribhuvan University",
    "त्रिभूवन विश्वविद्यालय": "Tribhuvan University",
    "त्रिभुवन विश्वविध्यालय": "Tribhuvan University",
    "त्रिभुवन युनिभर्सिटी": "Tribhuvan University",
    "त्रि.वि.": "Tribhuvan University",
    "त्रि.वि": "Tribhuvan University",
    "त्रि वि": "Tribhuvan University",
    "त्रि.वि.वि.": "Tribhuvan University",
    "त्रि.वि.वि": "Tribhuvan University",
    "त्रि वि वि": "Tribhuvan University",
    "टि.यु.": "Tribhuvan University",
    "टि.यू.": "Tribhuvan University",
    "TU": "Tribhuvan University",
    "T.U": "Tribhuvan University",
    "T.U.": "Tribhuvan University",
    "tu": "Tribhuvan University",
    "Tu": "Tribhuvan University",
    "Tribhuvan University": "Tribhuvan University",
    # Purbanchal University
    "पूर्वाञ्चल विश्वविद्यालय": "Purbanchal University",
    "PU": "Purbanchal University",
    # Boards and government
    "राष्ट्रिय परिक्षा बोर्ड": "National Examination Board",
    "NEB": "National Examination Board",
    "नेपाल बोर्ड": "Nepal Board",
    "बोर्ड अफ नेपाल ": "Board of Nepal",
    "Board of Nepal": "Board of Nepal",
    "SLC Board": "SLC Board",
    "SLC": "SLC Board",
    "slc": "SLC Board",
    "एस.एल.सि. बोर्ड": "SLC Board",
    "नेपाल सरकार": "Government of Nepal",
    "Government of Nepal": "Government of Nepal",
    "HMG": "Government of Nepal",
    "hmg": "Government of Nepal",
    "HMG BOARD": "Government of Nepal",
    "सरकारी": "Government",
    "सरकारी विद्यालय": "Government School",
    # HSEB
    "HSEB": "Higher Secondary Education Board",
    "hseb": "Higher Secondary Education Board",
    "H.S.B": "Higher Secondary Education Board",
    # Other
    "Nepal": "Nepal",
    "nepal": "Nepal",
    "भारत": "India",
    "India": "India",
    "छैन": "",
    "High School": "High School",
}

# Candidate fields that need _en counterparts
CANDIDATE_EN_FIELDS = [
    ("father_name", "father_name_en"),
    ("spouse_name", "spouse_name_en"),
    ("address", "address_en"),
    ("citizenship_district", "citizenship_district_en"),
    ("qualification", "qualification_en"),
    ("institution", "institution_en"),
    ("experience", "experience_en"),
    ("election_symbol_name", "election_symbol_name_en"),
    ("inclusion_group", "inclusion_group_en"),
]


class Command(BaseCommand):
    help = "Populate English fields by transliterating Nepali text."

    def add_arguments(self, parser: Any) -> None:
        parser.add_argument(
            "--force",
            action="store_true",
            help="Overwrite existing non-empty English values.",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        force: bool = options["force"]

        self._update_provinces(force)
        self._update_districts(force)
        self._update_parties(force)
        self._update_candidates(force)

        self.stdout.write(self.style.SUCCESS("Transliteration complete."))

    def _update_provinces(self, force: bool) -> None:
        provinces = Province.objects.all()
        updated: list[Province] = []
        for province in provinces:
            if not force and province.name and province.name != province.name_ne:
                continue
            english_name = PROVINCE_NAMES.get(province.source_id)
            if english_name:
                province.name = english_name
                updated.append(province)

        if updated:
            Province.objects.bulk_update(updated, ["name"], batch_size=500)
            self.stdout.write(f"  Provinces updated: {len(updated)}")
        else:
            self.stdout.write("  Provinces: nothing to update")

    def _update_districts(self, force: bool) -> None:
        districts = District.objects.all()
        updated: list[District] = []
        for district in districts:
            if not force and district.name and district.name != district.name_ne:
                continue
            english_name = DISTRICT_NAMES.get(district.name_ne)
            if english_name:
                district.name = english_name
            else:
                # Fallback to transliteration
                district.name = transliterate(district.name_ne)
            updated.append(district)

        if updated:
            District.objects.bulk_update(updated, ["name"], batch_size=500)
            self.stdout.write(f"  Districts updated: {len(updated)}")
        else:
            self.stdout.write("  Districts: nothing to update")

    def _update_parties(self, force: bool) -> None:
        parties = Party.objects.all()
        updated: list[Party] = []
        for party in parties:
            if not force and party.name:
                continue
            # Use hardcoded name first, fall back to transliteration
            official = PARTY_NAMES.get(party.name_ne)
            party.name = official if official else transliterate(party.name_ne)
            updated.append(party)

        if updated:
            Party.objects.bulk_update(updated, ["name"], batch_size=500)
            self.stdout.write(f"  Parties updated: {len(updated)}")
        else:
            self.stdout.write("  Parties: nothing to update")

    def _update_candidates(self, force: bool) -> None:
        candidates = Candidate.objects.all()
        updated: list[Candidate] = []
        update_fields = ["name"] + [en for _, en in CANDIDATE_EN_FIELDS]

        for candidate in candidates:
            changed = False

            # Name
            if force or not candidate.name:
                candidate.name = transliterate(candidate.name_ne)
                changed = True

            # All _en fields
            for ne_field, en_field in CANDIDATE_EN_FIELDS:
                if not force and getattr(candidate, en_field):
                    continue
                ne_value = getattr(candidate, ne_field)
                if ne_value:
                    if en_field == "citizenship_district_en":
                        en_value = DISTRICT_NAMES.get(ne_value, transliterate(ne_value))
                    elif en_field == "qualification_en":
                        en_value = QUALIFICATION_NAMES.get(ne_value, transliterate(ne_value))
                    elif en_field == "institution_en":
                        en_value = INSTITUTION_NAMES.get(ne_value, transliterate(ne_value))
                    elif en_field == "election_symbol_name_en":
                        en_value = SYMBOL_NAMES.get(ne_value, transliterate(ne_value))
                    else:
                        en_value = transliterate(ne_value)
                    setattr(candidate, en_field, en_value)
                    changed = True

            if changed:
                updated.append(candidate)

        if updated:
            Candidate.objects.bulk_update(updated, update_fields, batch_size=500)
            self.stdout.write(f"  Candidates updated: {len(updated)}")
        else:
            self.stdout.write("  Candidates: nothing to update")
