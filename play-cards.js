/* Original conversation and party cards. Personal photo decks start empty. */
window.DyperePlayCards = [];
(function () {
 const decks = {
 never:[
 'Jeg har aldri angret på en melding før den var ferdig sendt.',
 'Jeg har aldri øvd på en flørtende replikk i speilet.',
 'Jeg har aldri latet som jeg likte en sang for å imponere noen.',
 'Jeg har aldri brukt lengre tid på å velge antrekk enn på selve avtalen.',
 'Jeg har aldri sjekket hvem som hadde sett historien min mer enn én gang.',
 'Jeg har aldri planlagt et tilfeldig møte som ikke var særlig tilfeldig.',
 'Jeg har aldri glemt hva jeg skulle si fordi noen smilte til meg.',
 'Jeg har aldri latt som jeg var avslappet da jeg egentlig var kjempespent.'
 ],
 point:[
 'Hvem av oss hadde klart å snakke seg inn på en fullbooket restaurant?',
 'Hvem av oss hadde blitt mest avslørt av sin egen søkehistorikk om reiser?',
 'Hvem av oss hadde sendt den første meldingen etter en fantastisk date?',
 'Hvem av oss klarer dårligst å holde maska når noe er flaut?',
 'Hvem av oss hadde pakket mest til en hemmelig helgetur?',
 'Hvem av oss hadde gjort en spontan kveld til en hel historie?',
 'Hvem av oss hadde vunnet en konkurranse i overdreven sjarm?',
 'Hvem av oss hadde blitt kjent med hele nabobordet?'
 ],
 dilemma:[
 'En hemmelig helgetur eller en overraskelsesdate hjemme? Velg og forklar.',
 'Alltid vite hva den andre tenker, eller alltid kunne overraske hverandre?',
 'Gjenskape første date eller dra på en date ingen av dere har prøvd?',
 'Miste all retningssans eller alltid avsløre overraskelser ved et uhell?',
 'Kunne danse perfekt eller alltid finne de riktige ordene?',
 'En kveld helt uten telefon eller en dag helt uten planer?',
 'Bo en uke på et luksushotell eller en måned i en liten hytte?',
 'La den andre velge musikken eller antrekket til neste date?'
 ],
 challenge:[
 'Gi den andre en pris for en helt særegen egenskap. Hold en takketale tilbake.',
 'Lag en filmtrailer for deres neste helg. Du har 30 sekunder.',
 'Finn på et kodeord som betyr at dere trenger en liten pause fra verden.',
 'Presenter den andre som kveldens mest ettertraktede gjest.',
 'Selg inn en spontan date med bare fem ord.',
 'Hold en seriøs tale om hvorfor en helt vanlig gjenstand er romantisk.'
 ],
 talk:[
 'Hvilket lite øyeblikk med oss skulle du ønske du kunne spille av igjen?',
 'Hva gjør en vanlig tirsdag til en skikkelig god kveld sammen?',
 'Hva ved meg får deg fortsatt til å smile overrasket?',
 'Hvilket sted vil du at vi skal ha et eget minne fra?',
 'Hva er en liten ting du gjerne vil at vi skal gjøre oftere?',
 'Beskriv en perfekt overraskelse uten å avsløre hele planen.'
 ],
 guess:[
 'Gjett den andres ideelle date. Begge teller til tre og sier sitt svar.',
 'Gjett hvilken sang den andre ville valgt som deres kjenningsmelodi.',
 'Gjett hvilket minne den andre først tenker på når du sier «oss».',
 'Gjett hvor den andre ville reist hvis dere dro i morgen.',
 'Gjett om den andre velger spontanitet eller planlegging for neste date.',
 'Gjett hvilken egenskap den andre setter aller mest pris på hos deg.'
 ],
 joker:[
 'Bytt roller: den andre svarer på neste spørsmål som om de var deg.',
 'Begge velger én liten ting som skal gjøre resten av kvelden bedre.',
 'Lag deres egen regel for de to neste turene. Begge må si ja.',
 'Velg mellom et spørsmål og en improvisert utfordring neste tur.'
 ]};
 for (const [kind,texts] of Object.entries(decks)) texts.forEach((text,i)=>window.DyperePlayCards.push({id:`base-${kind}-${i}`,kind,role:'Alle',audience:['talk','guess','joker'].includes(kind)?'pair':'both',text}));
})();
/* RELEASE WISH PACK */
window.DyperePlayCards.forEach(c=>{c.pack=['talk','guess'].includes(c.kind)?'Bare oss to':'Kveldens historier';c.level=['challenge','joker'].includes(c.kind)&&Number(c.id.split('-').at(-1))>=2?2:1;c.enabled=true;});
(["En hel kveld uten telefoner.", "En overraskelsesdate der én planlegger alt.", "En liten tur til et sted ingen av oss har vært.", "En middag der vi lager en rett hver.", "En spillekveld med vår egen kortpakke.", "En kveld med musikken vi forbinder med hverandre.", "Et håndskrevet brev til den andre.", "Gjenskape en liten del av vår første date.", "En sen frokost uten planer etterpå.", "En ny aktivitet vi begge er nybegynnere i.", "En helgetur vi planlegger sammen.", "En overraskelse som vi velger hver vår halvdel av."]).forEach((text,i)=>window.DyperePlayCards.push({id:'base-wish-'+i,kind:'wish',role:'Alle',audience:'pair',text,pack:'Små ønsker',level:1,enabled:true}));
