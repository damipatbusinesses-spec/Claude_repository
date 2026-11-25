# Jak działa AI? — treatment

Styl: **One-line Drawing (一笔画)** z biblioteki Lemo-Opuscar. Długość: 10 s, 1920×1080, 24 fps.
Język: polski (napisy wpisywane odręcznie). Bez lektora (10 s, brak polskiego głosu offline w bibliotece).

## 1. Trzy struktury

1. **Linia jako wykres uczenia.** Linia rysuje krzywą błędu, która spada z każdą próbą. Precyzyjne, ale abstrakcyjne: widz nie wie, *czego* AI się uczy.
2. **Pytanie i odpowiedź.** Linia pisze „?”, które rozwija się w sieć i kończy na „!”. Ładne, ale mówi „AI odpowiada”, a nie „jak”.
3. **Przykłady → wzorzec → nowe rozpoznanie** (wybrana). Linia rysuje kilka małych kotów (dane), przechodzi przez prostą sieć neuronową (uczenie), a potem rysuje nowego, dużego kota (rozpoznanie / przewidywanie). Trzy kroki, które są dokładnie odpowiedzią na pytanie „jak działa AI”, i jeden obraz końcowy, w którym wszystko jest połączone jedną linią.

Wybór: 3. Najprostszy model mentalny uczenia maszynowego, a jedna nieprzerwana linia mówi sama: dane, sieć i wynik to jeden proces.

## 2. Logline i łuk

Jedna linia ogląda przykłady, przepływa przez sieć i sama rysuje coś nowego.
Ustawienie (dane) → zwrot (linia zwalnia w węzłach sieci, w których zbiera się tusz) → zakończenie (nowy kot w kolorze akcentu, pióro staje, kleks).

## 3. Benchmark

Uczyć się: gramatyka *La Linea* (linia jest światem), pewność jednego gestu.
Nie uczyć się: postaci, gagów, głosu; żadnej infografiki z ikonami.

## 4. Lista ujęć (jedno ujęcie, bez cięć; ruchy kamery)

| # | Czas | Kadr | Ruch | Dlaczego |
|---|---|---|---|---|
| 1 | 0.0–3.2 | średni, zoom 1.45 na lewą część | podążanie za stalówką (follow 0.45) | linia „wjeżdża” w trakcie biegu; widz czyta trzy małe koty jako serię przykładów |
| 2 | 3.2–6.4 | średni, zoom 1.3 na sieć | wolny przesuw w prawo, follow 0.35 | sieć musi się czytać jako całość: węzły = przystanki pióra |
| 3 | 6.4–8.9 | średni, zoom 1.2 na nowego kota | follow 0.3, lekkie dociśnięcie | najważniejsza kreska jest najwolniejsza |
| 4 | 8.9–10.0 | plan ogólny, zoom 0.95 | ciągły odjazd | odsłonięcie: wszystko było jednym rysunkiem |

## 5. Beat sheet

- 0.0 linia już biegnie od lewej krawędzi.
- 0.4–1.2 kot 1; 1.3–2.1 kot 2; 2.2–3.1 kot 3 (każdy inny: rozmiar, uszy).
- 3.2 linia skręca do sieci; 3.4–6.2 krawędzie sieci; przy każdym węźle krótkie zwolnienie i plamka tuszu.
- 6.4 wyjście z sieci, linia zmienia kolor na akcent.
- 6.7–8.8 duży kot (najwolniej); 8.8 powrót do czerni.
- 8.9–9.3 krótki ogon w dół, pióro staje → kleks; 9.3–10.0 cisza i odjazd.

## 6. Cue map

Bez sztywnego tempa: partytura jest pisana pod rysunek. Jeden instrument: harfa (szarpane struny, `pluck.py`).
- Każdy ukończony mały kot: jedna nuta (C5, D5, E5), rosnąco.
- Każdy węzeł sieci: krótka, cicha nuta z pentatoniki C.
- Duży kot: wolna fraza w górę; najwyższa nuta (C6) na czubku prawego ucha.
- Zatrzymanie pióra: jedna długa nuta (C4+G4) wybrzmiewa do ciszy.

## 7. Projekt dźwięku

| Sekcja | Tło | Foley | Muzyka |
|---|---|---|---|
| Dane | brak (cisza papieru) | pióro po papierze (szum z prędkości stalówki), stuknięcie przy pierwszym dotyku | nuty na końcu kotów |
| Sieć | brak | pióro, ciche „mokre” pęcznienie przy węzłach | krótkie nuty na węzłach |
| Nowy kot | brak | pióro, wolniej i ciemniej | fraza w górę |
| Stop | cisza dosłowna | mokre pęcznienie kleksa | długa nuta → zero |

## 8. Napisy

Font odręczny Caveat (z polskimi znakami), tusz ~84 %, bez ramki, wyśrodkowany przy dole, wpisywany od lewej (0.2 s + 17 ms/znak), znika w 0.45 s, z miękką aureolą koloru papieru.
1. 0.3–3.3 „AI ogląda wiele przykładów”
2. 3.5–6.6 „i szuka w nich wzorców.”
3. 6.8–9.9 „Potem rozpoznaje coś nowego.”
