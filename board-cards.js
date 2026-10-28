(function(root){
 'use strict';
 // Original editorial content. Each pack has ten cards in each of five types.
 // Levels 1/2/3 describe chapter depth, not a requirement to increase intensity.
 const decks=[
 {id:'stories',name:'Små historier',copy:'Minner, øyeblikk og detaljer dere kanskje har glemt.',cards:{
 talk:[
 'Hvilket lite øyeblikk fra den første tiden husker du overraskende godt?',
 'Fortell om en gang vi lo av noe som ingen andre ville forstått.',
 'Hvilken sang tar deg rett tilbake til en bestemt dag med oss?',
 'Hva husker du om et måltid vi delte, bortsett fra maten?',
 'Fortell om en plan som gikk galt, men ble et godt minne.',
 'Hvilket sted har blitt annerledes for deg fordi vi har vært der sammen?',
 'Hvilken hverdagslig dag fra forholdet ville du gjerne besøkt igjen?',
 'Når overrasket den andre deg ved å forstå noe uten mange ord?',
 'Hvilket minne beskriver best hvordan vi har forandret oss sammen?',
 'Hva håper du at vi fortsatt vil fortelle om når vi blir eldre?'
 ],guess:[
 'Gjett hvilken av turene våre den andre først tenker på akkurat nå.',
 'Gjett hvilken liten detalj den andre husker fra første gang dere møttes.',
 'Gjett hvilken felles matopplevelse den andre ville gjentatt.',
 'Gjett hvilket bilde av oss den andre ville valgt til et lite album.',
 'Gjett hvilken intern vits den andre tror har lengst levetid.',
 'Gjett hvilken feilbestilling eller bomtur den andre husker best.',
 'Gjett hvilket sted den andre forbinder med en skikkelig god samtale.',
 'Gjett hvilken av deres tradisjoner den andre helst vil bevare.',
 'Gjett hvilket uventet øyeblikk den andre mener gjorde dere mer til et lag.',
 'Gjett hva den andre ville kalt kapittelet om det siste året deres.'
 ],challenge:[
 'Beskriv et felles minne med tre ord. La den andre finne ut hvilket.',
 'Finn på en filmtittel til en tur dere har vært på sammen.',
 'Gjenfortell et morsomt øyeblikk som om du var en svært høytidelig nyhetsleser.',
 'Tegn et enkelt kart over et sted som betyr noe for dere. La den andre gjette.',
 'Velg et minne og fortell det annenhver setning, fra hvert deres perspektiv.',
 'Lag en liten prisutdeling for en av deres mest kaotiske dager.',
 'Beskriv den andre på en god dag med et bilde fra naturen, og forklar valget.',
 'Lag en fempunkts tidslinje over gode vendepunkter dere husker sammen.',
 'Fortell om et felles øyeblikk fra synsvinkelen til en tilfeldig kaffekopp.',
 'Lag en kort muntlig museumstekst om en gjenstand som symboliserer forholdet.'
 ],joker:[
 'Minnebytte: si én ting fra denne uken dere gjerne vil huske.',
 'Lydspor: nynne eller beskriv en sang som passer til et felles minne.',
 'Detaljjakt: velg et minne og legg til én liten detalj hver.',
 'Tittelrunde: gi denne kvelden et navn uten å diskutere først.',
 'To sannheter: fortell hver deres sanne detalj fra samme opplevelse.',
 'Fortellerbytte: la den som vanligvis lytter, velge hvilket minne dere deler.',
 'Postkort: si én setning dere kunne sendt hjem fra en tidligere tur.',
 'Tidshopp: velg noe fint fra i går, i fjor og den første tiden.',
 'Et annet blikk: fortell hvilken del av den andres historie du ikke kjente fra før.',
 'Bevar øyeblikket: velg én setning fra runden dere vil ta med videre.'
 ],wish:[
 'Velg et bilde dere kunne se på sammen etter spillet.',
 'Finn et gammelt felles favorittmåltid dere kan lage en annen dag.',
 'Velg én sang fra den første tiden som dere vil høre igjen.',
 'Bestem et sted i nærområdet dere gjerne vil besøke på nytt.',
 'Velg et godt minne dere kunne gjenskapt en liten del av uten store forberedelser.',
 'Finn en historie dere vil skrive ned med hver deres versjon.',
 'Velg en liten tradisjon dere ønsker å vekke til live igjen.',
 'Planlegg et lite album med fem bilder og én setning til hvert.',
 'Velg en erfaring dere ønsker mer av, og finn en enkel anledning til den.',
 'Finn et minne dere vil takke hverandre for, og avslutt med deres egne ord.'
 ]}},
 {id:'duel',name:'Leken duell',copy:'Vennlige gjetninger, små dueller og mye latter.',cards:{
 talk:[
 'Hvilken fullstendig uviktig konkurranse tar du litt for alvorlig?',
 'Hvilken ferdighet burde vi hatt et eget mesterskap i hjemme?',
 'Når har du sist blitt lattermild på et veldig upassende tidspunkt?',
 'Hvilken hverdagsoppgave kunne du gjort til et underholdningsprogram?',
 'Hva er den mest sjarmerende dårlige unnskyldningen du har hørt?',
 'Hva tror du vi hadde blitt uventet gode på som konkurransepar?',
 'Hvilken av våre små forskjeller gjør livet morsommere?',
 'Hvis vi startet en useriøs klubb, hva ville formålet og navnet vært?',
 'Når er det lettest for deg å være leken uten å føle deg vurdert?',
 'Hvordan kan vi beholde mer humor når en plan ikke går slik vi tenkte?'
 ],guess:[
 'Gjett om den andre ville valgt et quizlag eller et karaokeinnslag.',
 'Gjett hvilket dyr den andre mener ville vært den beste kollegaen.',
 'Gjett om den andre ville vært arrangør, kommentator eller deltaker i et raritetsmesterskap.',
 'Gjett hvilken helt vanlig ting den andre helst ville fått en gullmedalje for.',
 'Gjett hvilket spill den andre tror du ville blitt mest konkurransepreget av.',
 'Gjett hvem den andre ville valgt som lagkamerat blant fiktive karakterer.',
 'Gjett hvilken av dere den andre mener kunne holdt en seriøs tale om en potet.',
 'Gjett om den andre heller vil vinne på flaks eller tape med en genial plan.',
 'Gjett hvilken av deres egenskaper den andre ville gitt et overdrevent superheltnavn.',
 'Gjett hva den andre mener er deres sterkeste egenskap som lag når det blir kaos.'
 ],challenge:[
 'Finn på det mest overbevisende slagordet for en helt vanlig skje.',
 'Nevn tre ting på bokstaven K som kunne vært med på en date.',
 'Hold en ti sekunders takketale for en oppdiktet, svært uviktig pris.',
 'Beskriv en tannbørste som om den var årets største teknologinyhet.',
 'Bytt på å finne på alternative navn til en sofa. Stopp før det slutter å være morsomt.',
 'Lag hver deres restaurantnavn av to ting dere kan se i rommet.',
 'Gi værmeldingen for humøret ditt uten å bruke ordet humør.',
 'Argumenter vennlig for at frokost burde serveres på et helt annet tidspunkt.',
 'Finn på en ny sport som kan forklares med tre setninger og ikke krever utstyr.',
 'Lag sammen en ettminutts presentasjon av dere som et lag med absurd gode kvalifikasjoner.'
 ],joker:[
 'Samarbeidsrunde: finn fem ord som høres hyggelige ut, annenhver gang.',
 'Omvendt reklame: finn en sympatisk grunn til at en dårlig idé likevel er litt god.',
 'Alfabetduell: si én hyggelig ting hver på neste bokstav dere velger.',
 'Navnelek: gi hverandre et vennlig turneringsnavn for resten av runden.',
 'Kommentatorpause: beskriv én liten ting den andre gjør som en sportsbragd.',
 'Null poeng: fortell om et tap eller en bommert som ble en god historie.',
 'Hjemmelaget rekord: finn en ufarlig rekord dere begge allerede kan ha.',
 'Lagbygging: finn et felles heiarop som ikke trenger å ropes.',
 'Feiring i miniatyr: finn en diskret måte å markere gode øyeblikk på sammen.',
 'Uavgjort: velg noe dere begge er gode på, uten å kåre en vinner.'
 ],wish:[
 'Velg en liten ordlek dere kan ta én runde til av senere.',
 'Finn et brett- eller kortspill dere allerede har og kunne tatt frem en annen dag.',
 'Planlegg en vennlig quiz med tre spørsmål hver om helt ufarlige temaer.',
 'Velg en morsom historie dere vil fortelle hverandre etter spillet.',
 'Finn på en liten premie som består av tid sammen og som begge ønsker.',
 'Planlegg en spillekveld der dere spiller på lag i stedet for mot hverandre.',
 'Velg en ufarlig ferdighet dere begge kunne prøvd som nybegynnere.',
 'Bestem en anledning der dere vil gjøre en vanlig oppgave litt mer leken.',
 'Lag en ny tradisjon for å feire forsøk, også når noe ikke lykkes.',
 'Velg én måte å ta med humoren fra denne runden inn i morgendagen.'
 ]}},
 {id:'studio',name:'Skaperverksted',copy:'Lag små historier, nye ideer og noe helt deres eget.',cards:{
 talk:[
 'Hvis vi kunne innrede et lite rom bare for trivsel, hva måtte vært der?',
 'Hvilken kreativ aktivitet likte du før du begynte å tenke på om du var flink?',
 'Hvilken farge passer til en skikkelig god dag for deg?',
 'Hva ville du laget hvis resultatet aldri skulle vises frem til noen?',
 'Hvilken liten detalj gjør et sted personlig for deg?',
 'Hva kunne vi skapt sammen på én time med det vi allerede har?',
 'Hvilket uttrykk passer best til oss: en melodi, en skisse, en historie eller noe annet?',
 'Når blir du mest inspirert: med rammer eller med helt blanke ark?',
 'Hvordan vil du at den andre skal støtte deg når du prøver noe du ikke mestrer ennå?',
 'Hva kunne vi laget som bare ville hatt verdi fordi vi laget det sammen?'
 ],guess:[
 'Gjett hvilken farge den andre ville valgt til en rolig lesekrok.',
 'Gjett om den andre heller vil lage en spilleliste eller tegne et kart.',
 'Gjett hvilket enkelt materiale den andre helst vil skape noe med.',
 'Gjett om den andre liker best å finne på begynnelsen eller avslutningen av en historie.',
 'Gjett hva den andre ville kalt en kafé dere drev sammen.',
 'Gjett hvilken sans den andre ville brukt som utgangspunkt for en liten utstilling.',
 'Gjett om den andre ønsker frie valg eller ett tydelig oppdrag når dere lager noe.',
 'Gjett hvilken av deres ideer den andre mener fortjener et nytt forsøk.',
 'Gjett hva den andre tror er den viktigste ingrediensen i deres kreative samarbeid.',
 'Gjett hvilken type prosjekt den andre ville likt å ha et helt år på å utvikle med deg.'
 ],challenge:[
 'Finn på tre navn til et lite sted som bare eksisterer i fantasien.',
 'Beskriv en ny farge med to ting du allerede kjenner.',
 'Lag en historie på nøyaktig seks ord, én hver eller sammen.',
 'Tegn eller beskriv et symbol for denne kvelden.',
 'Lag et menykort med tre retter som er oppkalt etter gode egenskaper ved dere.',
 'Finn på et fiktivt reisemål og velg én attraksjon hver.',
 'Lag et lydspor med tre sangtitler som beskriver en helt vanlig dag sammen.',
 'Beskriv et hverdagsobjekt uten å si hva det brukes til. Den andre gjetter.',
 'Lag et lite manifest for et vennlig hjem med tre setninger dere begge liker.',
 'Finn på en tradisjon som kombinerer én idé fra hver av dere, uten å kjøpe noe.'
 ],joker:[
 'Ett ord hver: velg to ord og finn en hyggelig forbindelse mellom dem.',
 'Perspektivskifte: beskriv rommet som om dere så det for første gang.',
 'Tittel først: finn på en boktittel og si én setning om hva boken handler om.',
 'Miniformat: lag en invitasjon på maks ti ord til en koselig kveld.',
 'Begrensning: finn en dateidé som bare trenger én ting dere allerede eier.',
 'Kombiner: slå sammen to av favorittstedene deres til et nytt sted.',
 'Bygg videre: én starter med en vennlig idé, den andre legger til én detalj.',
 'Tre sanser: beskriv et tenkt sted med lyd, lys og lukt.',
 'Redaktørbytte: velg hver deres favorittdetalj fra noe den andre nettopp fant på.',
 'Ta vare på ideen: si én ting fra runden som dere gjerne vil lage på ordentlig.'
 ],wish:[
 'Velg et lite kreativt prosjekt som kan få være uperfekt.',
 'Finn to sanger dere vil legge i en felles spilleliste.',
 'Planlegg et hjemmelaget kort til hverandre en annen dag.',
 'Velg et enkelt motiv dere begge kunne tegnet på hver deres måte.',
 'Finn en idé til et måltid dere kan lage av det som allerede finnes hjemme.',
 'Planlegg en liten fototur med et tema som ikke krever at noen blir fotografert.',
 'Velg en gjenstand dere vil gi en ny, hyggelig bruk sammen.',
 'Finn en kreativ tradisjon dere kan gjøre uten å dele resultatet offentlig.',
 'Avtal et tidspunkt til et prosjekt der ingen av dere skal være eksperten.',
 'Velg noe dere har skapt i kveld som dere vil gi en fortsettelse.'
 ]}},
 {id:'perspectives',name:'Nye perspektiver',copy:'Bli bedre kjent uten fasit, prestasjon eller forhør.',cards:{
 talk:[
 'Hva gjør at du kjenner deg velkommen når du kommer hjem?',
 'Hvilken liten vane hjelper deg å finne ro etter en travel dag?',
 'Hva liker du at noen spør deg om, men sjelden blir spurt om?',
 'Hvilken egenskap setter du mer pris på nå enn før?',
 'Hva gjør det lett for deg å si at du trenger litt tid?',
 'Hva er forskjellen på en god overraskelse og en ubehagelig overraskelse for deg?',
 'Når føler du deg best forstått: når noen spør, lytter eller hjelper praktisk?',
 'Hvilken forventning til en perfekt kveld kunne du gjerne gitt slipp på?',
 'Hva har du lært om deg selv som du ønsker at vi skal ha mer plass til?',
 'Hva betyr det for deg å kunne være både selvstendig og del av et lag?'
 ],guess:[
 'Gjett om den andre helst vil ha en stille eller en pratsom start på dagen.',
 'Gjett hvilken liten ting den andre savner først på en travel uke.',
 'Gjett om den andre helst ønsker selskap eller en pause etter mye sosialt.',
 'Gjett hva den andre mener gjør et besøk ekstra hyggelig.',
 'Gjett om den andre liker best å få en konkret invitasjon eller flere alternativer.',
 'Gjett hvilken type hjelp den andre helst vil få når en plan blir vanskelig.',
 'Gjett hvilken av deres forskjeller den andre mener er mest nyttig for dere.',
 'Gjett hva den andre foretrekker: rask avklaring eller tid til å tenke seg om.',
 'Gjett hva den andre vil ha mer plass til i et vanlig døgn.',
 'Gjett hvilket ord den andre ønsker at neste måned skal preges av.'
 ],challenge:[
 'Velg et hyggelig ord hver og fortell hva dere legger i det.',
 'Beskriv en god dag uten å nevne jobb eller gjøremål.',
 'Fortell én liten ting som har gitt deg energi denne uken.',
 'Velg mellom ro, variasjon og fellesskap, og si hvorfor det passer deg i dag.',
 'Fortell om en preferanse du har endret med tiden. Den andre stiller ett åpent spørsmål.',
 'Fullfør setningen: Det er lettere for meg å slappe av når …',
 'Beskriv en hyggelig grense med egne ord, uten å måtte forklare hvorfor den finnes.',
 'Fortell hvordan en invitasjon kan høres ut når det også er lett å takke nei.',
 'Si én ting du ønsker å bli spurt om før noen lager en plan på dine vegne.',
 'Finn én forskjell dere kan gi plass til uten at noen trenger å endre seg.'
 ],joker:[
 'Lyttebytte: én snakker om noe hyggelig i et halvt minutt, den andre bare lytter.',
 'Ordforklaring: velg et hverdagsord og se om dere mener det samme med det.',
 'Et nytt spørsmål: still et ufarlig spørsmål du faktisk er nysgjerrig på svaret på.',
 'Ingen løsning: del en liten observasjon uten å be den andre fikse noe.',
 'Dobbel mulighet: nevn to forskjellige måter dere begge kan ha en god kveld på.',
 'Speiling: gjengi noe fint du har forstått om den andre i dag. La dem korrigere.',
 'Ny vinkel: finn en fordel ved hver av to forskjellige preferanser dere har.',
 'Plass til begge: si hva som gjør det greit for deg at den andre ønsker noe annet.',
 'Rolig avklaring: velg en liten plan og si hva dere trenger å vite før dere bestemmer dere.',
 'Felles språk: finn en enkel setning dere kan bruke når dere vil justere en plan.'
 ],wish:[
 'Velg en liten ting som kan gjøre morgendagen litt hyggeligere for begge.',
 'Finn en samtale dere vil gi mer tid til en annen dag.',
 'Velg én måte å invitere hverandre med i en plan som passer dere begge.',
 'Avtal en rolig stund uten krav om å finne på noe spesielt.',
 'Finn en liten forskjell dere vil gjøre enklere å leve godt med.',
 'Velg et spørsmål dere vil tenke litt på hver for dere og eventuelt dele senere.',
 'Avtal hvordan dere vil si fra når dere trenger å endre en avtale.',
 'Finn en hverdagsrutine der begge kan få litt mer av det de trenger.',
 'Velg én ting dere vil slutte å måle opp mot andres forhold.',
 'Avslutt med et felles ønske som gir plass til at dere kan være forskjellige.'
 ]}},
 {id:'everyday',name:'Hverdagsmagi',copy:'Små gleder, gode vaner og en hyggeligere hverdag.',cards:{
 talk:[
 'Hvilken helt vanlig ting gleder du deg oftest over?',
 'Hva er ditt beste tegn på at helgen har begynt?',
 'Hvilken lukt eller lyd får et sted til å føles hjemlig for deg?',
 'Hvilket lite ritual vil du helst ikke skynde deg gjennom?',
 'Hvilken enkel ting gjør den andre som gjør dagen din lettere?',
 'Hva ville du gjerne hatt ti minutter mer til i hverdagen?',
 'Hvilken oppgave blir hyggeligere når vi gjør den sammen?',
 'Hva gjør en vanlig middag til en opplevelse du husker?',
 'Hva trenger vi mindre av for å få mer overskudd til hverandre?',
 'Hvilken liten vane kunne gjort at vi oftere merker at vi er et lag?'
 ],guess:[
 'Gjett hvilken frokost den andre helst vil ha på en helt fri dag.',
 'Gjett hvilken plass hjemme den andre liker best akkurat nå.',
 'Gjett om den andre ville valgt frisk luft, musikk eller stillhet som en liten pause.',
 'Gjett hvilken av ukens dager den andre helst ville gitt litt ekstra omsorg.',
 'Gjett hvilken hverdagslyd den andre ville fjernet om det var mulig.',
 'Gjett hvilket lite ritual den andre mener er mest undervurdert.',
 'Gjett hva den andre først ville gjort med en uventet, ledig time.',
 'Gjett hvilken felles vane den andre håper dere fortsatt har om fem år.',
 'Gjett hvilken praktisk lettelse den andre ville satt mest pris på neste uke.',
 'Gjett hva den andre mener er forskjellen på fri tid og ordentlig hvile.'
 ],challenge:[
 'Finn tre ting i rommet som gjør det hyggeligere å være her.',
 'Beskriv ditt ideelle lille pusterom med én setning.',
 'Lag en oppdiktet meny til en helt vanlig tirsdag som høres ekstra fin ut.',
 'Si én liten ting den andre gjorde denne uken som du la merke til.',
 'Finn en hyggelig måte å gjøre en rutine kortere eller enklere på sammen.',
 'Velg hver deres favorittpause og lag en kombinasjon som begge kunne likt.',
 'Beskriv et godt hjem ved å bruke tre verb i stedet for tre ting.',
 'Lag et forslag til en telefonsvak halvtime uten krav om å være produktive.',
 'Finn en liten oppgave dere kan forenkle i stedet for å gjøre mer imponerende.',
 'Lag en trepunkts oppskrift på en god dag der ingen av punktene krever kjøp.'
 ],joker:[
 'Takknemlig detalj: si én liten ting som er bra med akkurat dette øyeblikket.',
 'Pausemeny: nevn én stille og én sosial pause hver.',
 'Senk listen: finn én hyggelig plan som får være veldig enkel.',
 'Kompliment til hverdagen: gi et vanlig øyeblikk et uvanlig fint navn.',
 'Bytt briller: beskriv én rutine slik du tror den andre opplever den. Spør om det stemmer.',
 'Mindre er nok: velg noe dere kan droppe fra en tenkt perfekt kveld.',
 'Dagens lille seier: fortell om noe du fikk til, selv om ingen andre så det.',
 'En hjelpende detalj: si hvilken liten avklaring som gjør en travel dag lettere.',
 'Ingen effektivisering: finn noe hyggelig som gjerne kan få ta litt tid.',
 'Godt nok: finn en plan dere begge kan glede dere til uten at alt må klaffe.'
 ],wish:[
 'Velg en enkel drikkepause dere kan dele med det dere allerede har.',
 'Finn en sang som kan følge en hverdagsoppgave dere gjør sammen.',
 'Velg en dag dere vil ha en liten, skjermfri stund.',
 'Finn en liten velkomst dere begge liker når dere møtes etter dagen.',
 'Velg en rutine dere kan gjøre litt mer behagelig uten å legge til arbeid.',
 'Avtal en pause der dere ikke skal planlegge eller løse noe.',
 'Velg ett praktisk spørsmål dere kan avklare tidlig for å gi mer ro senere.',
 'Finn en enkel måte å vise at den andres innsats blir sett.',
 'Lag plass til én liten glede hver i den neste uken.',
 'Velg en felles hverdagsvane som skal handle om trivsel, ikke prestasjon.'
 ]}},
 {id:'adventure',name:'Ut på eventyr',copy:'Oppdag nye muligheter, fra sofaen til en liten tur.',cards:{
 talk:[
 'Hvilket sted like i nærheten har du alltid vært litt nysgjerrig på?',
 'Hva gjør en liten tur til et eventyr for deg?',
 'Liker du best å oppdage en ny vei eller vende tilbake til en favoritt?',
 'Hvilken type utsikt gjør at du får lyst til å bli sittende?',
 'Hva ville du vist den andre hvis du var guide på et sted fra oppveksten?',
 'Hvilken nybegynneropplevelse kunne du tenke deg å dele uten å måtte bli god?',
 'Hva er forskjellen på spontanitet som er gøy og spontanitet som blir stress for deg?',
 'Hvordan ser en god oppdagelsesdag ut når energien er lav?',
 'Hvilken type reise kunne lært oss noe nytt om hverandre uten å være stor eller dyr?',
 'Hva håper du at vi fortsatt tør å være nybegynnere i sammen?'
 ],guess:[
 'Gjett om den andre ville valgt hav, skog, by eller et rolig sted hjemme som utsikt.',
 'Gjett om den andre helst vil ha kart, guide eller tid til å finne veien selv.',
 'Gjett hvilken liten ting den andre alltid ville hatt med på tur.',
 'Gjett om den andre velger tidlig start eller en langsom formiddag på en fridag.',
 'Gjett hvilket sted i nærområdet den andre først ville vist en besøkende.',
 'Gjett om den andre helst vil lære noe nytt, smake noe nytt eller se noe nytt.',
 'Gjett hvor mye av en hyggelig overraskelsestur den andre vil vite på forhånd.',
 'Gjett hvilket vær den andre mener passer best til en liten oppdagelsesdag.',
 'Gjett hvilken tilpasning som gjør en ukjent aktivitet mer fristende for den andre.',
 'Gjett hva den andre vil være mest glad for å huske fra en fremtidig tur: et sted, et øyeblikk eller en samtale.'
 ],challenge:[
 'Finn på et navn til en liten ekspedisjon dere kunne gjort fra sofaen.',
 'Beskriv en tur dere kunne tenkt dere på bare fem ord.',
 'Lag hver deres perfekte, lille pakkeliste med tre ting.',
 'Finn en oppdagelse dere kan gjøre uten å forlate rommet.',
 'Lag et forslag til en lokal tur med både en rolig og en mer aktiv variant.',
 'Beskriv en fiktiv guidebokside om et sted dere allerede kjenner godt.',
 'Velg en ukjent aktivitet og finn en liten, tilgjengelig første prøve.',
 'Lag en plan A og en like hyggelig plan B til en tenkt fridag.',
 'Finn en ny måte å besøke et kjent sted på som ikke krever mer penger.',
 'Lag et forslag til en dag der hver av dere får være guide for én liten del.'
 ],joker:[
 'Oppdagerblikk: finn én liten ting i rommet du ikke hadde lagt merke til før.',
 'Reisekort: velg et sted dere kjenner og gi det et nytt turistnavn.',
 'Værbytte: finn én hyggelig plan for sol og én for regn.',
 'Nærmest først: nevn et lite sted dere kan glede dere til uten lang reise.',
 'To tempoer: beskriv samme tur som både langsom og kort.',
 'Guidebytte: la hver av dere fortelle om et sted den andre ikke kjenner godt.',
 'Hjemmeeventyr: finn en oppdagelse dere kan gjøre med en bok, et kart eller et minne.',
 'Uten handleliste: finn en ny opplevelse som bruker noe dere allerede har.',
 'Trygg start: si én ting du vil vite før du takker ja til en ukjent aktivitet.',
 'Felles kompass: finn én ting dere begge ønsker å oppdage mer av sammen.'
 ],wish:[
 'Velg et sted dere vil lese eller snakke litt mer om sammen.',
 'Finn en kort og tilgjengelig rute dere kan vurdere en annen dag.',
 'Velg et kjent sted dere vil besøke med litt mer tid enn sist.',
 'Finn en opplevelse dere kan ha hjemme hvis været eller energien sier stopp.',
 'Planlegg en liten lokal oppdagelse med tydelig tidsramme og valgfri pengebruk.',
 'Velg en aktivitet dere vil prøve uten å bestemme dere for å fortsette med den.',
 'La hver av dere foreslå én liten del av en fremtidig fridag.',
 'Finn en lavterskelvariant av en tur dere lenge har snakket om.',
 'Avtal en liten overraskelse der rammene er kjente, men én hyggelig detalj er hemmelig.',
 'Velg et felles eventyrønske og det aller minste første steget som begge ønsker.'
 ]}}
 ];
 const cards=decks.flatMap(pack=>Object.entries(pack.cards).flatMap(([kind,texts])=>texts.map((text,i)=>({id:'base-board-'+pack.id+'-'+kind+'-'+String(i+1).padStart(2,'0'),kind,role:'Alle',audience:'pair',text,pack:pack.name,level:i<4?1:i<8?2:3,enabled:true}))));
 const packs=decks.map(({id,name,copy})=>({id,name,copy}));
 const api={version:1,packs,cards};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else{root.DypereBoardLibrary=api;root.DyperePlayCards=[...(root.DyperePlayCards||[]),...cards];}
})(globalThis);
