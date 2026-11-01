window.DypereActivityDatabase = {
  "version": 1,
  "description": "Ikke-grafiske aktiviteter og samtalerammer. Eksakte interesser og kveldens ja er påkrevd. Ingen automatisk utvidelse fra en kategori til en handling.",
  "activities": [
    {
      "id": "activity-massage-01",
      "enabled": true,
      "title": "Massasje etter tur",
      "description": "Én gir massasje, den andre tar imot. Dere bytter når dere ønsker.",
      "genres": [
        "naerhet"
      ],
      "level": 1,
      "minutes": 10,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "pdf-613649e86e90c1",
            "pdf-d3aeadbcaafc89",
            "pdf-b6e756b1f61e3e"
          ],
          "routes": [
            [
              "gi",
              "motta"
            ],
            [
              "motta",
              "gi"
            ]
          ]
        }
      ],
      "steps": [
        "Finn et behagelig sted og velg hvem som begynner.",
        "Gi massasje innenfor det mottakeren ønsker.",
        "Bytt hvis begge vil, eller avslutt med en rolig pause."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-massage-02",
      "enabled": true,
      "title": "Hendene i fokus",
      "description": "En kort håndmassasje med tid til å finne et behagelig tempo.",
      "genres": [
        "naerhet"
      ],
      "level": 1,
      "minutes": 5,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "pdf-613649e86e90c1",
            "pdf-d3aeadbcaafc89",
            "pdf-b6e756b1f61e3e"
          ],
          "routes": [
            [
              "gi",
              "motta"
            ],
            [
              "motta",
              "gi"
            ]
          ]
        }
      ],
      "steps": [
        "Velg hvem som gir og hvem som mottar.",
        "Gi hendene oppmerksomhet og spør hva som kjennes behagelig.",
        "Avslutt eller bytt roller når dere ønsker."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-massage-03",
      "enabled": true,
      "title": "En stille massasjestund",
      "description": "La én person ta imot mens den andre gir en rolig massasje.",
      "genres": [
        "naerhet"
      ],
      "level": 1,
      "minutes": 15,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "pdf-613649e86e90c1",
            "pdf-d3aeadbcaafc89",
            "pdf-b6e756b1f61e3e"
          ],
          "routes": [
            [
              "gi",
              "motta"
            ],
            [
              "motta",
              "gi"
            ]
          ]
        }
      ],
      "steps": [
        "Velg sted og hvem som begynner.",
        "Finn et tempo mottakeren ønsker, uten å skynde dere videre.",
        "Ta en pause og velg om dere vil bytte."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-massage-04",
      "enabled": true,
      "title": "Gi, lytt, bytt",
      "description": "Veksle mellom å gi og å ta imot, med en liten tilbakemelding underveis.",
      "genres": [
        "naerhet"
      ],
      "level": 1,
      "minutes": 20,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "pdf-613649e86e90c1",
            "pdf-d3aeadbcaafc89",
            "pdf-b6e756b1f61e3e"
          ],
          "routes": [
            [
              "gi",
              "motta"
            ],
            [
              "motta",
              "gi"
            ]
          ]
        }
      ],
      "steps": [
        "Velg første rollefordeling.",
        "Den som tar imot sier hva de ønsker mer eller mindre av.",
        "Bytt bare hvis ønskene deres passer begge veier."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-kisses-01",
      "enabled": true,
      "title": "Et kyss og en pause",
      "description": "Gi plass til et enkelt kyss og et øyeblikk sammen.",
      "genres": [
        "munn"
      ],
      "level": 1,
      "minutes": 5,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "pdf-3612420d8c3b21",
            "pdf-ec737799f51683"
          ],
          "routes": [
            [
              "gi",
              "motta"
            ],
            [
              "motta",
              "gi"
            ],
            [
              "delta",
              "delta"
            ],
            [
              "sammen",
              "sammen"
            ]
          ]
        }
      ],
      "steps": [
        "Velg hvem som tar initiativ.",
        "Del et kyss når begge ønsker det.",
        "Ta en pause og kjenn etter hva dere ønsker videre."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-kisses-02",
      "enabled": true,
      "title": "Hils på hverandre på nytt",
      "description": "Gjør et lite gjensyn til et eget øyeblikk.",
      "genres": [
        "munn"
      ],
      "level": 1,
      "minutes": 5,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "pdf-3612420d8c3b21",
            "pdf-ec737799f51683"
          ],
          "routes": [
            [
              "gi",
              "motta"
            ],
            [
              "motta",
              "gi"
            ],
            [
              "delta",
              "delta"
            ],
            [
              "sammen",
              "sammen"
            ]
          ]
        }
      ],
      "steps": [
        "Møt hverandre som om dere akkurat kom hjem.",
        "Gi hverandre den velkomsten dere har lyst til.",
        "Avslutt med et kyss hvis det passer begge."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-kisses-03",
      "enabled": true,
      "title": "Velg et lite øyeblikk",
      "description": "Bytt på å fortelle hva som gjør et kyss fint for dere.",
      "genres": [
        "munn"
      ],
      "level": 1,
      "minutes": 10,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "pdf-3612420d8c3b21",
            "pdf-ec737799f51683"
          ],
          "routes": [
            [
              "gi",
              "motta"
            ],
            [
              "motta",
              "gi"
            ],
            [
              "delta",
              "delta"
            ],
            [
              "sammen",
              "sammen"
            ]
          ]
        }
      ],
      "steps": [
        "Fortell én ting hver dere liker ved et kyss.",
        "Velg et lite øyeblikk dere ønsker å dele nå.",
        "La det være akkurat så kort eller langt som dere vil."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-kisses-04",
      "enabled": true,
      "title": "En varm velkomst",
      "description": "La den ene invitere til et lite gjensyn, og den andre velge svaret.",
      "genres": [
        "munn"
      ],
      "level": 1,
      "minutes": 10,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "pdf-3612420d8c3b21",
            "pdf-ec737799f51683"
          ],
          "routes": [
            [
              "gi",
              "motta"
            ],
            [
              "motta",
              "gi"
            ],
            [
              "delta",
              "delta"
            ],
            [
              "sammen",
              "sammen"
            ]
          ]
        }
      ],
      "steps": [
        "Velg hvem som inviterer først.",
        "Gi en enkel invitasjon til nærhet.",
        "Del et kyss hvis dere begge ønsker, og bytt gjerne initiativ."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-clothes-01",
      "enabled": true,
      "title": "Et første møte",
      "description": "Velg et antrekk og møt hverandre som fiktive, voksne karakterer.",
      "genres": [
        "lek"
      ],
      "level": 1,
      "minutes": 15,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "pdf-e836bd9ed2fef6"
          ]
        }
      ],
      "steps": [
        "Finn frem et antrekk hver.",
        "Velg navn og lat som dere møtes for første gang.",
        "Still hverandre tre spørsmål og avslutt scenen sammen."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-clothes-02",
      "enabled": true,
      "title": "To antrekk, ett tema",
      "description": "Finn en felles ramme ut fra det dere allerede har tilgjengelig.",
      "genres": [
        "lek"
      ],
      "level": 1,
      "minutes": 10,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "pdf-e836bd9ed2fef6"
          ]
        }
      ],
      "steps": [
        "Velg et antrekk hver.",
        "Vis hverandre valgene og finn et felles tema.",
        "Finn på en kort samtale mellom karakterene."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-clothes-03",
      "enabled": true,
      "title": "En invitasjon med stil",
      "description": "La antrekkene sette rammen for en liten invitasjon.",
      "genres": [
        "lek"
      ],
      "level": 1,
      "minutes": 15,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "pdf-e836bd9ed2fef6"
          ]
        }
      ],
      "steps": [
        "Velg hvordan dere vil kle dere.",
        "Den ene inviterer den andre til et tenkt arrangement.",
        "Spill ut møtet og velg en avslutning sammen."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-clothes-04",
      "enabled": true,
      "title": "Maskeraden uten masker",
      "description": "La et valgt antrekk gi dere en ny identitet for en liten stund.",
      "genres": [
        "lek"
      ],
      "level": 1,
      "minutes": 20,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "pdf-e836bd9ed2fef6"
          ]
        }
      ],
      "steps": [
        "Finn på et voksent navn og en bakgrunn hver.",
        "Møt hverandre på en tenkt maskerade.",
        "Gjett én detalj om den andres karakter før dere går ut av rollene."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-roles-01",
      "enabled": true,
      "title": "Vert og gjest",
      "description": "Den ene tar imot, og den andre kommer på et fiktivt besøk.",
      "genres": [
        "styring"
      ],
      "level": 1,
      "minutes": 10,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "topic-569d7dc1611b50",
            "pdf-98399b56c45cd4"
          ]
        }
      ],
      "steps": [
        "Velg hvem som er vert og hvem som er gjest.",
        "Verten inviterer til en samtale eller noe å drikke.",
        "Avslutt besøket og gå ut av rollene sammen."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-roles-02",
      "enabled": true,
      "title": "En kveld uten manus",
      "description": "Bytt på å finne neste setning i en felles, fiktiv historie.",
      "genres": [
        "styring"
      ],
      "level": 1,
      "minutes": 15,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "topic-569d7dc1611b50",
            "pdf-98399b56c45cd4"
          ]
        }
      ],
      "steps": [
        "Velg et sted og voksne karakterer.",
        "Den ene åpner scenen, den andre svarer.",
        "Gi historien en avslutning dere begge liker."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-roles-03",
      "enabled": true,
      "title": "En hemmelig beskjed",
      "description": "La en liten beskjed sette i gang en kort scene.",
      "genres": [
        "styring"
      ],
      "level": 1,
      "minutes": 15,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "topic-569d7dc1611b50",
            "pdf-98399b56c45cd4"
          ]
        }
      ],
      "steps": [
        "Velg hvem som sender og hvem som finner beskjeden.",
        "Skriv en enkel invitasjon til et sted hjemme.",
        "Møt hverandre i de valgte rollene og avslutt scenen sammen."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-roles-04",
      "enabled": true,
      "title": "Bytt hvem som inviterer",
      "description": "Prøv to korte versjoner av samme møte.",
      "genres": [
        "styring"
      ],
      "level": 1,
      "minutes": 20,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "topic-569d7dc1611b50",
            "pdf-98399b56c45cd4"
          ]
        }
      ],
      "steps": [
        "Velg et sted og voksne roller.",
        "Spill et kort møte der den ene tar initiativ.",
        "Bytt initiativ og avslutt med å si hvilken versjon dere likte."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-sensory-01",
      "enabled": true,
      "title": "Gjett en lyd",
      "description": "En liten sanselek der én lager en lyd og den andre gjetter.",
      "genres": [
        "naerhet"
      ],
      "level": 1,
      "minutes": 5,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "topic-770875de6bd8d9",
            "topic-5ac6a10dc55c56"
          ],
          "routes": [
            [
              "gi",
              "motta"
            ],
            [
              "motta",
              "gi"
            ],
            [
              "delta",
              "delta"
            ],
            [
              "sammen",
              "sammen"
            ]
          ]
        }
      ],
      "steps": [
        "Velg hvem som lager den første lyden.",
        "Bruk en vanlig, ufarlig gjenstand eller musikk dere har tilgjengelig.",
        "La den andre gjette, og bytt hvis dere vil."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-sensory-02",
      "enabled": true,
      "title": "Tre små sanseinntrykk",
      "description": "Bytt på å velge et lite sanseinntrykk å dele.",
      "genres": [
        "naerhet"
      ],
      "level": 1,
      "minutes": 10,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "topic-770875de6bd8d9",
            "topic-5ac6a10dc55c56"
          ],
          "routes": [
            [
              "gi",
              "motta"
            ],
            [
              "motta",
              "gi"
            ],
            [
              "delta",
              "delta"
            ],
            [
              "sammen",
              "sammen"
            ]
          ]
        }
      ],
      "steps": [
        "Velg hvem som begynner.",
        "Del en lyd eller en behagelig tekstur som den andre ønsker å oppleve.",
        "Fortell hva dere la merke til, og bytt."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-sensory-03",
      "enabled": true,
      "title": "Lytt sammen",
      "description": "La en kjent lyd få hele oppmerksomheten en liten stund.",
      "genres": [
        "naerhet"
      ],
      "level": 1,
      "minutes": 10,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "topic-770875de6bd8d9",
            "topic-5ac6a10dc55c56"
          ],
          "routes": [
            [
              "gi",
              "motta"
            ],
            [
              "motta",
              "gi"
            ],
            [
              "delta",
              "delta"
            ],
            [
              "sammen",
              "sammen"
            ]
          ]
        }
      ],
      "steps": [
        "Velg en låt eller en lyd dere begge ønsker å høre.",
        "Lytt uten å gjøre noe annet.",
        "Fortell hverandre én ting dere la merke til."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-wardrobe-01",
      "enabled": true,
      "title": "Vis meg antrekket ditt",
      "description": "La én vise et valgt antrekk mens den andre gir det oppmerksomhet.",
      "genres": [
        "risiko"
      ],
      "level": 1,
      "minutes": 10,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "topic-60e5f258a91a88",
            "topic-5022472b2831c6"
          ],
          "routes": [
            [
              "bruke",
              "se"
            ],
            [
              "se",
              "bruke"
            ]
          ]
        }
      ],
      "steps": [
        "Velg antrekk eller tilbehør dere allerede har.",
        "Den som har lyst til å bruke det, viser det frem.",
        "Den andre forteller hva de legger merke til."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-wardrobe-02",
      "enabled": true,
      "title": "Et lite antrekksvalg",
      "description": "Velg mellom to plagg eller tilbehør innenfor det dere har avklart.",
      "genres": [
        "risiko"
      ],
      "level": 1,
      "minutes": 10,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "topic-60e5f258a91a88",
            "topic-5022472b2831c6"
          ],
          "routes": [
            [
              "bruke",
              "se"
            ],
            [
              "se",
              "bruke"
            ]
          ]
        }
      ],
      "steps": [
        "Finn to muligheter dere allerede har.",
        "Den som skal bruke antrekket velger selv hva som passer.",
        "Del et lite øyeblikk med det valgte antrekket."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-wardrobe-03",
      "enabled": true,
      "title": "Ett plagg, en ny ramme",
      "description": "La et plagg eller tilbehør bli utgangspunktet for en liten date hjemme.",
      "genres": [
        "risiko"
      ],
      "level": 1,
      "minutes": 15,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "topic-60e5f258a91a88",
            "topic-5022472b2831c6"
          ],
          "routes": [
            [
              "bruke",
              "se"
            ],
            [
              "se",
              "bruke"
            ]
          ]
        }
      ],
      "steps": [
        "Velg det dere ønsker å ha på dere.",
        "Finn et sted hjemme hvor dere kan møtes på nytt.",
        "Gi antrekket oppmerksomhet og velg hvordan daten avsluttes."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-medical-01",
      "enabled": true,
      "title": "Doktor og pasient",
      "description": "En fiktiv konsultasjon mellom to voksne roller, uten undersøkelser eller behandling.",
      "genres": [
        "kraft"
      ],
      "level": 1,
      "minutes": 15,
      "groups": [
        2
      ],
      "requires": [
        {
          "anyOf": [
            "topic-4750957f183f21",
            "pdf-0486f818b123d7"
          ]
        }
      ],
      "steps": [
        "Velg hvem som er doktor og hvem som er pasient.",
        "Pasienten forteller om en oppdiktet hverdagssituasjon, og doktoren stiller spørsmål.",
        "Avslutt konsultasjonen, gå ut av rollene og ta en rolig pause."
      ],
      "source": "original-non-graphic",
      "roleLabels": {
        "gi": "Doktor",
        "motta": "Pasient",
        "delta": "Deltar sammen"
      }
    },
    {
      "id": "activity-medical-02",
      "enabled": true,
      "title": "En time på venterommet",
      "description": "La en kort samtale på en fiktiv klinikk sette scenen.",
      "genres": [
        "kraft"
      ],
      "level": 1,
      "minutes": 10,
      "groups": [
        2
      ],
      "requires": [
        {
          "anyOf": [
            "topic-4750957f183f21",
            "pdf-0486f818b123d7"
          ]
        }
      ],
      "steps": [
        "Velg voksne karakterer og navn.",
        "Spill møtet fra en høflig velkomst til en kort samtale.",
        "Avslutt scenen sammen og møt hverandre som dere selv."
      ],
      "source": "original-non-graphic",
      "roleLabels": {
        "gi": "Doktor",
        "motta": "Pasient",
        "delta": "Deltar sammen"
      }
    },
    {
      "id": "activity-medical-03",
      "enabled": true,
      "title": "Oppfølgingstimen",
      "description": "Møt hverandre til en fiktiv oppfølgingssamtale.",
      "genres": [
        "kraft"
      ],
      "level": 1,
      "minutes": 15,
      "groups": [
        2
      ],
      "requires": [
        {
          "anyOf": [
            "topic-4750957f183f21",
            "pdf-0486f818b123d7"
          ]
        }
      ],
      "steps": [
        "Velg hvem som leder samtalen og hvem som forteller.",
        "Snakk i rollene om hva som gir den fiktive pasienten mer ro i hverdagen.",
        "Gå ut av rollene og del hvordan scenen opplevdes."
      ],
      "source": "original-non-graphic",
      "roleLabels": {
        "gi": "Doktor",
        "motta": "Pasient",
        "delta": "Deltar sammen"
      }
    },
    {
      "id": "activity-medical-04",
      "enabled": true,
      "title": "Klinikken med nye navn",
      "description": "La antrekkene og voksne rollefigurer danne rammen for en fiktiv konsultasjon.",
      "genres": [
        "kraft"
      ],
      "level": 1,
      "minutes": 20,
      "groups": [
        2
      ],
      "requires": [
        {
          "anyOf": [
            "topic-4750957f183f21",
            "pdf-0486f818b123d7"
          ]
        },
        {
          "anyOf": [
            "pdf-e836bd9ed2fef6"
          ]
        }
      ],
      "steps": [
        "Finn frem et valgt antrekk og finn på navn til de voksne rollene.",
        "Spill en kort konsultasjon som bare består av samtale.",
        "Avslutt scenen og ta en rolig pause sammen."
      ],
      "source": "original-non-graphic",
      "roleLabels": {
        "gi": "Doktor",
        "motta": "Pasient",
        "delta": "Deltar sammen"
      }
    },
    {
      "id": "activity-care-01",
      "enabled": true,
      "title": "Et rolig pusterom",
      "description": "Sett dere til rette og la stunden få en rolig avslutning.",
      "genres": [
        "naerhet"
      ],
      "level": 1,
      "minutes": 5,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "topic-9bf48923a47a23",
            "pdf-6ec62f1af4180f"
          ],
          "routes": [
            [
              "gi",
              "motta"
            ],
            [
              "motta",
              "gi"
            ],
            [
              "delta",
              "delta"
            ],
            [
              "sammen",
              "sammen"
            ]
          ]
        }
      ],
      "steps": [
        "Finn et behagelig sted.",
        "Velg om dere vil være stille eller snakke litt.",
        "Spør hverandre hva dere trenger nå."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-care-02",
      "enabled": true,
      "title": "Det jeg vil ta med videre",
      "description": "Avslutt med én ting dere likte og én ting dere ønsker neste gang.",
      "genres": [
        "naerhet"
      ],
      "level": 1,
      "minutes": 10,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "topic-9bf48923a47a23",
            "pdf-6ec62f1af4180f"
          ],
          "routes": [
            [
              "gi",
              "motta"
            ],
            [
              "motta",
              "gi"
            ],
            [
              "delta",
              "delta"
            ],
            [
              "sammen",
              "sammen"
            ]
          ]
        }
      ],
      "steps": [
        "Sett dere sammen.",
        "Fortell én ting hver dere satte pris på.",
        "Del et ønske for en annen stund, uten å måtte planlegge den nå."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-care-03",
      "enabled": true,
      "title": "En liten stund uten krav",
      "description": "La ro og oppmerksomhet være hele aktiviteten.",
      "genres": [
        "naerhet"
      ],
      "level": 1,
      "minutes": 15,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "topic-9bf48923a47a23",
            "pdf-6ec62f1af4180f"
          ],
          "routes": [
            [
              "gi",
              "motta"
            ],
            [
              "motta",
              "gi"
            ],
            [
              "delta",
              "delta"
            ],
            [
              "sammen",
              "sammen"
            ]
          ]
        }
      ],
      "steps": [
        "Finn et sted hvor dere kan være i fred.",
        "Velg den nærheten eller avstanden som passer.",
        "Avslutt når dere ønsker og si hva som var fint."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-depth-01",
      "enabled": true,
      "title": "Avklar rammen sammen",
      "description": "Bruk et bekreftet tema fra kveldens utvalg som grunnlag for en konkret samtale om ønsker.",
      "genres": [
        "dybde"
      ],
      "level": 1,
      "minutes": 10,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "topic-730b114f1a2395",
            "topic-118fc681c071eb",
            "topic-685f64ecd153f2",
            "topic-5d6133d3e787cb",
            "topic-8e4764c3e0510a",
            "topic-1e3a2be2c4683f",
            "topic-29c0e221cccc50",
            "topic-eea2a65f8f4739",
            "topic-80f09b5fe73bdf"
          ]
        }
      ],
      "steps": [
        "Velg ett av kveldens bekreftede temaer.",
        "Si hva hver av dere ønsker og hva som holdes utenfor.",
        "Avslutt med en felles oppsummering. Dette er en samtale, ikke en utførelsesbeskrivelse."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-depth-02",
      "enabled": true,
      "title": "Et tema, to perspektiver",
      "description": "Fortell hverandre hva som gjør ett av kveldens temaer interessant.",
      "genres": [
        "dybde"
      ],
      "level": 1,
      "minutes": 15,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "topic-730b114f1a2395",
            "topic-118fc681c071eb",
            "topic-685f64ecd153f2",
            "topic-5d6133d3e787cb",
            "topic-8e4764c3e0510a",
            "topic-1e3a2be2c4683f",
            "topic-29c0e221cccc50",
            "topic-eea2a65f8f4739",
            "topic-80f09b5fe73bdf"
          ]
        }
      ],
      "steps": [
        "Velg et tema som dere har bekreftet i kveld.",
        "La hver person fortelle sitt perspektiv uten avbrytelser.",
        "Oppsummer hva dere er enige om og hva som fortsatt er uavklart."
      ],
      "source": "original-non-graphic"
    },
    {
      "id": "activity-depth-03",
      "enabled": true,
      "title": "Rollene dere ønsker nå",
      "description": "Bruk et bekreftet tema til å sette ord på rollefordelingen dere ønsker.",
      "genres": [
        "dybde"
      ],
      "level": 1,
      "minutes": 10,
      "groups": [
        2,
        3,
        4
      ],
      "requires": [
        {
          "anyOf": [
            "topic-730b114f1a2395",
            "topic-118fc681c071eb",
            "topic-685f64ecd153f2",
            "topic-5d6133d3e787cb",
            "topic-8e4764c3e0510a",
            "topic-1e3a2be2c4683f",
            "topic-29c0e221cccc50",
            "topic-eea2a65f8f4739",
            "topic-80f09b5fe73bdf"
          ]
        }
      ],
      "steps": [
        "Se på rollene dere har svart ja til i kveld.",
        "Fortell hva som gjør den valgte rollen interessant for deg.",
        "Avslutt samtalen med det dere ønsker å ta med videre."
      ],
      "source": "original-non-graphic"
    }
  ]
};
