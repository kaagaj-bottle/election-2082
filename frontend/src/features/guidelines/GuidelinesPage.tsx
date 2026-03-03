import { Card } from '@/components/ui/Card';
import { useLang } from '@/contexts/language-context';
import ballotPaperImage from '@/assets/ballot-paper-2082.webp';

function GuidelinesPage() {
  const { lang } = useLang();
  const isNe = lang === 'ne';
  const n = (ne: string, en: string) => (isNe ? ne : en);
  const font = isNe ? 'font-nepali' : '';

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      {/* 1. Header */}
      <div className="text-center">
        <h1 className={`text-3xl font-bold text-ink-900 dark:text-ink-50 ${font}`}>
          {n('मतदान निर्देशिका', 'Voting Guidelines')}
        </h1>
        <p className={`mt-2 text-ink-500 dark:text-ink-400 ${font}`}>
          {n(
            'प्रतिनिधि सभा निर्वाचन २०८२ — मतदानसम्बन्धी जानकारी',
            'House of Representatives Election 2082 — Everything you need to know about voting',
          )}
        </p>
      </div>

      {/* 2. Election Overview */}
      <Card>
        <h2 className={`mb-3 text-xl font-semibold text-ink-800 dark:text-ink-100 ${font}`}>
          {n('निर्वाचन परिचय', 'Election Overview')}
        </h2>
        <div className={`space-y-2 text-sm text-ink-600 dark:text-ink-300 ${font}`}>
          <p>
            {n(
              'प्रतिनिधि सभामा जम्मा २७५ सिट छन् — १६५ सिट प्रत्यक्ष (FPTP) र ११० सिट समानुपातिक (PR) प्रणाली अन्तर्गत।',
              'The House of Representatives has 275 seats — 165 elected through First Past The Post (FPTP) and 110 through Proportional Representation (PR).',
            )}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
              <p className="font-semibold text-red-700 dark:text-red-400">
                {n('प्रत्यक्ष (FPTP) — १६५ सिट', 'Direct (FPTP) — 165 Seats')}
              </p>
              <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                {n(
                  'मतदाताले आफ्नो निर्वाचन क्षेत्रको एक उम्मेदवारलाई मत दिन्छन्। सबैभन्दा बढी मत पाउने उम्मेदवार विजयी हुन्छन्।',
                  'Voters choose one candidate in their constituency. The candidate with the most votes wins.',
                )}
              </p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
              <p className="font-semibold text-blue-700 dark:text-blue-400">
                {n('समानुपातिक (PR) — ११० सिट', 'Proportional (PR) — 110 Seats')}
              </p>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-300">
                {n(
                  'मतदाताले एउटा दललाई मत दिन्छन्। दलले प्राप्त मतको अनुपातमा सिट पाउँछन्।',
                  'Voters choose one party. Seats are allocated proportionally based on total votes received.',
                )}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Voter Eligibility */}
      <Card>
        <h2 className={`mb-3 text-xl font-semibold text-ink-800 dark:text-ink-100 ${font}`}>
          {n('मतदाताको योग्यता', 'Voter Eligibility')}
        </h2>
        <ul className={`list-inside list-disc space-y-1.5 text-sm text-ink-600 dark:text-ink-300 ${font}`}>
          <li>{n('नेपाली नागरिक हुनुपर्छ', 'Must be a Nepali citizen')}</li>
          <li>{n('उमेर १८ वर्ष पूरा भएको हुनुपर्छ', 'Must be at least 18 years of age')}</li>
          <li>
            {n(
              'मतदाता नामावलीमा नाम दर्ता भएको हुनुपर्छ',
              'Must be registered on the voter roll',
            )}
          </li>
          <li>
            {n(
              'मतदान केन्द्रमा आफैं उपस्थित हुनुपर्छ',
              'Must be present in person at the polling station',
            )}
          </li>
        </ul>
      </Card>

      {/* 4. Required Documents */}
      <Card>
        <h2 className={`mb-3 text-xl font-semibold text-ink-800 dark:text-ink-100 ${font}`}>
          {n('आवश्यक कागजात', 'Required Documents')}
        </h2>
        <p className={`mb-2 text-sm text-ink-600 dark:text-ink-300 ${font}`}>
          {n(
            'मतदान गर्न निम्न मध्ये कुनै एक परिचयपत्र चाहिन्छ:',
            'Any one of the following identity documents is required to vote:',
          )}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            n('मतदाता परिचयपत्र', 'Voter ID Card'),
            n('नेपाली नागरिकता प्रमाणपत्र', 'Citizenship Certificate'),
            n('राष्ट्रिय परिचयपत्र', 'National ID Card'),
            n('राहदानी (पासपोर्ट)', 'Passport'),
            n('सवारी चालक अनुमतिपत्र', 'Driving License'),
          ].map((doc) => (
            <div
              key={doc}
              className="flex items-center gap-2 rounded-md border border-surface-200 bg-surface-50 px-3 py-2 dark:border-surface-700 dark:bg-surface-800"
            >
              <span className="text-primary-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
              </span>
              <span className={`text-sm text-ink-700 dark:text-ink-200 ${font}`}>
                {doc}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* 5. Step-by-Step Voting Process */}
      <Card>
        <h2 className={`mb-4 text-xl font-semibold text-ink-800 dark:text-ink-100 ${font}`}>
          {n('मतदान प्रक्रिया (चरणबद्ध)', 'Step-by-Step Voting Process')}
        </h2>
        <div className="space-y-3">
          {[
            {
              step: 1,
              ne: 'मतदान केन्द्रमा पुग्नुहोस् र लाइनमा बस्नुहोस्',
              en: 'Arrive at your assigned polling station and join the queue',
            },
            {
              step: 2,
              ne: 'परिचयपत्र देखाउनुहोस् र नामावलीमा नाम जाँच गराउनुहोस्',
              en: 'Present your ID document and get verified against the voter roll',
            },
            {
              step: 3,
              ne: 'बायाँ हातको औंलामा मसी (इन्क) लगाइन्छ',
              en: 'Your left index finger is marked with indelible ink',
            },
            {
              step: 4,
              ne: 'पहिलो मतपत्र (प्रत्यक्ष / FPTP — रातो) प्राप्त गर्नुहोस्',
              en: 'Receive the first ballot paper (FPTP — red themed)',
            },
            {
              step: 5,
              ne: 'मतदान कक्षमा जानुहोस् — गोप्य रूपमा मतदान गर्नुहोस्',
              en: 'Enter the voting booth — vote in secrecy',
            },
            {
              step: 6,
              ne: 'रोजेको उम्मेदवारको छापमा ठीकसँग छाप लगाउनुहोस्',
              en: 'Stamp clearly inside the box next to your chosen candidate',
            },
            {
              step: 7,
              ne: 'मतपत्र मोड्नुहोस् र मतपेटिकामा खसाल्नुहोस्',
              en: 'Fold the ballot and deposit it in the ballot box',
            },
            {
              step: 8,
              ne: 'दोस्रो मतपत्र (समानुपातिक / PR — नीलो) प्राप्त गर्नुहोस्',
              en: 'Receive the second ballot paper (PR — blue themed)',
            },
            {
              step: 9,
              ne: 'रोजेको दलको छापमा छाप लगाई मतपेटिकामा खसाल्नुहोस्',
              en: 'Stamp next to your chosen party and deposit it in the ballot box',
            },
            {
              step: 10,
              ne: 'मतदान केन्द्रबाट बाहिरिनुहोस्',
              en: 'Exit the polling station',
            },
          ].map(({ step, ne, en }) => (
            <div key={step} className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                {step}
              </div>
              <p className={`pt-0.5 text-sm text-ink-600 dark:text-ink-300 ${font}`}>
                {n(ne, en)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* 6. Sample Ballot Papers */}
      <Card>
        <h2 className={`mb-4 text-xl font-semibold text-ink-800 dark:text-ink-100 ${font}`}>
          {n('नमुना मतपत्र', 'Sample Ballot Papers')}
        </h2>
        <p className={`mb-4 text-sm text-ink-500 dark:text-ink-400 ${font}`}>
          {n(
            'यस निर्वाचनमा तपाईंले २ वटा मतपत्र प्राप्त गर्नुहुनेछ। बायाँतिर प्रत्यक्ष (FPTP) र दायाँतिर समानुपातिक (PR) मतपत्र देखाइएको छ:',
            'You will receive 2 ballot papers in this election. The FPTP ballot is shown on the left and the PR ballot on the right:',
          )}
        </p>
        <img
          src={ballotPaperImage}
          alt={n(
            'प्रतिनिधि सभा निर्वाचन २०८२ को नमुना मतपत्र — प्रत्यक्ष (FPTP) र समानुपातिक (PR)',
            'Sample ballot papers for House of Representatives Election 2082 — FPTP and PR',
          )}
          className="w-full rounded-lg border border-surface-200 dark:border-surface-700"
        />
        <p className={`mt-3 text-center text-xs text-ink-400 dark:text-ink-500 ${font}`}>
          {n('स्रोत', 'Source')}:{' '}
          <a
            href="https://nepallaws.com/election/articles/nepal-ballot-paper-guide-2082/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-500 underline hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
          >
            nepallaws.com
          </a>
        </p>
      </Card>

      {/* 7. Invalid Vote Rules */}
      <Card>
        <h2 className={`mb-3 text-xl font-semibold text-ink-800 dark:text-ink-100 ${font}`}>
          {n('अमान्य मत (बदर मत)', 'Invalid Vote Rules')}
        </h2>
        <p className={`mb-3 text-sm text-ink-500 dark:text-ink-400 ${font}`}>
          {n(
            'निम्न अवस्थामा मत बदर हुन्छ:',
            'A ballot is considered invalid if:',
          )}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            {
              ne: 'एकभन्दा बढी उम्मेदवार/दलमा छाप लगाएमा',
              en: 'Stamp is placed on more than one candidate/party',
            },
            {
              ne: 'छाप बाकसबाहिर लागेमा',
              en: 'Stamp falls outside the designated box',
            },
            {
              ne: 'कलम वा अन्य साधनले चिन्ह लगाएमा',
              en: 'Marked with pen, pencil, or other means instead of stamp',
            },
            {
              ne: 'मतपत्र खाली छाडेमा (कुनै छाप नलगाएमा)',
              en: 'Ballot is left blank (no stamp applied)',
            },
            {
              ne: 'मतपत्र च्यातिएमा वा बिग्रिएमा',
              en: 'Ballot is torn or defaced',
            },
            {
              ne: 'मतपत्रमा पहिचान खुल्ने कुनै चिन्ह लगाएमा',
              en: 'Any identifying mark is made on the ballot',
            },
          ].map(({ ne, en }) => (
            <div
              key={en}
              className="flex items-start gap-2 rounded-md border border-red-100 bg-red-50/50 px-3 py-2 dark:border-red-900/40 dark:bg-red-950/20"
            >
              <span className="mt-0.5 text-red-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
              <span className={`text-sm text-ink-600 dark:text-ink-300 ${font}`}>
                {n(ne, en)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* 8. Do's and Don'ts */}
      <Card>
        <h2 className={`mb-4 text-xl font-semibold text-ink-800 dark:text-ink-100 ${font}`}>
          {n('गर्नुहोस् र नगर्नुहोस्', "Do's and Don'ts")}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Do's */}
          <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-950/20">
            <h3 className={`mb-2 font-semibold text-green-700 dark:text-green-400 ${font}`}>
              {n('गर्नुहोस्', "Do's")}
            </h3>
            <ul className="space-y-2">
              {[
                { ne: 'परिचयपत्र अनिवार्य रूपमा लैजानुहोस्', en: 'Carry your ID document' },
                { ne: 'छापबाट मात्र मतदान गर्नुहोस्', en: 'Vote only using the provided stamp' },
                { ne: 'छाप बाकसभित्र मात्र लगाउनुहोस्', en: 'Place stamp inside the box only' },
                { ne: 'मतपत्र राम्रोसँग मोड्नुहोस्', en: 'Fold the ballot properly' },
                { ne: 'गोप्य रूपमा मतदान गर्नुहोस्', en: 'Vote in secrecy' },
              ].map(({ ne, en }) => (
                <li key={en} className="flex items-start gap-2">
                  <span className="mt-0.5 text-green-600 dark:text-green-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className={`text-sm text-ink-600 dark:text-ink-300 ${font}`}>
                    {n(ne, en)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Don'ts */}
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-800 dark:bg-red-950/20">
            <h3 className={`mb-2 font-semibold text-red-700 dark:text-red-400 ${font}`}>
              {n('नगर्नुहोस्', "Don'ts")}
            </h3>
            <ul className="space-y-2">
              {[
                { ne: 'मतदान कक्षमा मोबाइल फोन नलैजानुहोस्', en: 'Do not take a mobile phone into the booth' },
                { ne: 'मतपत्रको फोटो नखिच्नुहोस्', en: 'Do not photograph the ballot' },
                { ne: 'अरूलाई आफ्नो मत नदेखाउनुहोस्', en: 'Do not show your ballot to others' },
                { ne: 'मतदान केन्द्रमा हल्ला नगर्नुहोस्', en: 'Do not cause disturbance at the polling station' },
                { ne: 'एकभन्दा बढी ठाउँमा छाप नलगाउनुहोस्', en: 'Do not stamp on more than one spot' },
              ].map(({ ne, en }) => (
                <li key={en} className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-600 dark:text-red-400">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                  <span className={`text-sm text-ink-600 dark:text-ink-300 ${font}`}>
                    {n(ne, en)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* 9. Special Provisions */}
      <Card>
        <h2 className={`mb-3 text-xl font-semibold text-ink-800 dark:text-ink-100 ${font}`}>
          {n('विशेष व्यवस्था', 'Special Provisions')}
        </h2>
        <ul className={`list-inside list-disc space-y-1.5 text-sm text-ink-600 dark:text-ink-300 ${font}`}>
          <li>
            {n(
              'ज्येष्ठ नागरिक, गर्भवती महिला र अपाङ्गता भएका व्यक्तिलाई प्राथमिकता लाइनको व्यवस्था छ',
              'Priority queue is available for senior citizens, pregnant women, and persons with disabilities',
            )}
          </li>
          <li>
            {n(
              'दृष्टिविहीन मतदाताले विश्वासपात्र साथी वा कर्मचारीको सहयोगमा मतदान गर्न सक्छन्',
              'Visually impaired voters may vote with assistance from a trusted companion or official',
            )}
          </li>
          <li>
            {n(
              'शारीरिक अपाङ्गता भएका व्यक्तिलाई मतदान कक्षसम्म सहयोग उपलब्ध छ',
              'Physical assistance is available to help persons with physical disabilities reach the voting booth',
            )}
          </li>
          <li>
            {n(
              'ब्रेल मतपत्र वा ट्याम्प्लेटको व्यवस्था उपलब्ध हुन सक्छ',
              'Braille ballot or tactile template may be available upon request',
            )}
          </li>
        </ul>
      </Card>
    </div>
  );
}

export default GuidelinesPage;
