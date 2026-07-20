#!/usr/bin/env python3
"""Build the public, audio-free CIRCLE MIX Routing chart bundle.

The input beatmaps are intentionally read from reference-input/, which is
excluded locally and is never part of the generated bundle.  The conversion is
an adaptation: unsafe micro-bursts are consolidated, slider gestures are
re-authored by difficulty, and reverse/curved paths can emit multiple CIRCLE
MIX gestures instead of a one-object/one-note translation.
"""

from __future__ import annotations

import argparse
import collections
import json
import math
import pathlib
import zipfile


BPM = 144.0
BEAT_MS = 60000.0 / BPM
ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "reference-input" / "routing-beatmaps-source.zip"
ORDER = ["Beginner", "Normal", "Advanced", "Hyper", "Another", "Lasse's Extra", "Reverb"]
CONFIG = {
    "Beginner": dict(slug="beginner", label="BEGINNER", stars=1.5, quantum=45.0, min_gap=.75, rank=0),
    "Normal": dict(slug="normal", label="NORMAL", stars=2.4, quantum=30.0, min_gap=.50, rank=1),
    "Advanced": dict(slug="advanced", label="ADVANCED", stars=3.5, quantum=22.5, min_gap=.50, rank=2),
    "Hyper": dict(slug="hyper", label="HYPER", stars=4.7, quantum=15.0, min_gap=.25, rank=3),
    "Another": dict(slug="another", label="ANOTHER", stars=6.2, quantum=15.0, min_gap=.25, rank=4),
    "Lasse's Extra": dict(slug="lasses-extra", label="LASSE'S EXTRA", stars=7.3, quantum=15.0, min_gap=.25, rank=5),
    "Reverb": dict(slug="reverb", label="REVERB", stars=7.6, quantum=7.5, min_gap=.25, rank=6),
}


def parse_sections(text: str) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {}
    current = None
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith("[") and line.endswith("]"):
            current = line[1:-1]
            sections[current] = []
        elif current and line and not line.startswith("//"):
            sections[current].append(line)
    return sections


def parse_key_values(lines: list[str]) -> dict[str, str]:
    values = {}
    for line in lines:
        if ":" in line:
            key, value = line.split(":", 1)
            values[key.strip()] = value.strip()
    return values


def active_timing(points: list[dict], time: int, inherited: bool | None = None) -> dict:
    candidates = [point for point in points if point["time"] <= time and (inherited is None or point["inherited"] == inherited)]
    if candidates:
        return candidates[-1]
    candidates = [point for point in points if inherited is None or point["inherited"] == inherited]
    return candidates[0]


def parse_beatmap(text: str) -> dict:
    sections = parse_sections(text)
    metadata = parse_key_values(sections["Metadata"])
    difficulty = parse_key_values(sections["Difficulty"])
    timing = []
    for line in sections["TimingPoints"]:
        fields = line.split(",")
        timing.append({
            "time": float(fields[0]),
            "beatLength": float(fields[1]),
            "inherited": int(fields[6]) == 0 if len(fields) > 6 else False,
        })
    timing.sort(key=lambda point: point["time"])
    slider_multiplier = float(difficulty.get("SliderMultiplier", 1.4))
    objects = []
    for source_index, line in enumerate(sections["HitObjects"]):
        fields = line.split(",")
        x, y, time, flags = int(fields[0]), int(fields[1]), int(fields[2]), int(fields[3])
        obj = {"sourceIndex": source_index, "x": x, "y": y, "time": time, "kind": "circle", "burst": 1}
        if flags & 2:
            curve = fields[5].split("|")
            points = [(x, y)] + [tuple(map(int, point.split(":"))) for point in curve[1:]]
            repeats = int(fields[6])
            pixel_length = float(fields[7])
            red = active_timing(timing, time, False)
            current = active_timing(timing, time)
            sv = -100.0 / current["beatLength"] if current["inherited"] and current["beatLength"] < 0 else 1.0
            duration_ms = pixel_length / (100.0 * slider_multiplier * sv) * red["beatLength"] * repeats
            segment_angles = []
            for first, second in zip(points, points[1:]):
                dx, dy = second[0] - first[0], second[1] - first[1]
                if dx or dy:
                    segment_angles.append(math.degrees(math.atan2(dy, dx)))
            internal_turns = [abs(signed_delta(a, b)) for a, b in zip(segment_angles, segment_angles[1:])]
            obj.update(kind="slider", curve=curve[0], points=points, repeats=repeats, pixelLength=pixel_length,
                       durationBeat=duration_ms / BEAT_MS, sharp=any(turn >= 100 for turn in internal_turns))
        elif flags & 8:
            obj.update(kind="spinner", endTime=int(fields[5]), durationBeat=(int(fields[5]) - time) / BEAT_MS)
        objects.append(obj)
    return {"metadata": metadata, "difficulty": difficulty, "timing": timing, "objects": objects}


def normalize_angle(value: float) -> float:
    return value % 360.0


def signed_delta(start: float, end: float) -> float:
    return (end - start + 180.0) % 360.0 - 180.0


def shortest_angle(start: float, end: float) -> float:
    return abs(signed_delta(start, end))


def quantize(value: float, quantum: float) -> float:
    return normalize_angle(round(normalize_angle(value) / quantum) * quantum)


def position_angle(point: tuple[int, int], fallback: float, quantum: float) -> float:
    dx, dy = point[0] - 256, point[1] - 192
    if math.hypot(dx, dy) < 28:
        return quantize(fallback + quantum, quantum)
    # CIRCLE MIX chart angles are 0 at the top and increase clockwise.
    return quantize(math.degrees(math.atan2(dy, dx)) + 90.0, quantum)


def slider_sweep(obj: dict, start_angle: float, quantum: float) -> float:
    angles = []
    fallback = start_angle
    for point in obj["points"]:
        angle = position_angle(point, fallback, quantum)
        fallback = angle
        if not angles or shortest_angle(angles[-1], angle) >= quantum / 2:
            angles.append(angle)
    sweep = sum(signed_delta(first, second) for first, second in zip(angles, angles[1:]))
    if abs(sweep) < quantum:
        endpoint = position_angle(obj["points"][-1], start_angle, quantum)
        sweep = signed_delta(start_angle, endpoint)
    if abs(sweep) < quantum:
        first, last = obj["points"][0], obj["points"][-1]
        cross = (first[0] - 256) * (last[1] - 192) - (first[1] - 192) * (last[0] - 256)
        sweep = quantum if cross >= 0 else -quantum
    return max(-270.0, min(270.0, quantize_signed(sweep, quantum)))


def quantize_signed(value: float, quantum: float) -> float:
    sign = 1 if value >= 0 else -1
    return sign * max(quantum, round(abs(value) / quantum) * quantum)


def consolidate_objects(objects: list[dict], minimum_gap: float) -> list[dict]:
    selected = []
    for source in objects:
        obj = dict(source)
        obj["beat"] = round(source["time"] / BEAT_MS, 3)
        if selected and obj["beat"] - selected[-1]["beat"] < minimum_gap - .01:
            selected[-1]["burst"] = selected[-1].get("burst", 1) + 1
            selected[-1].setdefault("mergedSourceIndices", []).append(source["sourceIndex"])
            continue
        selected.append(obj)
    return selected


def note(note_type: str, beat: float, angle: float, **extra) -> dict:
    result = {"type": note_type, "beat": round(beat, 3), "angle": round(normalize_angle(angle), 3)}
    for key, value in extra.items():
        if value is not None:
            result[key] = round(value, 3) if isinstance(value, float) else value
    return result


def directional_type(family: str, sweep: float) -> str:
    return family + ("CW" if sweep >= 0 else "CCW")


def motion_note(family: str, beat: float, angle: float, sweep: float, duration: float, quantum: float) -> dict:
    sweep = quantize_signed(sweep, quantum)
    end_angle = quantize(angle + sweep, quantum)
    extra = {"endAngle": end_angle, "durationBeat": round(duration, 3)}
    if family == "trace":
        extra["signedSweepAngle"] = round(sweep, 3)
    return note(directional_type(family, sweep), beat, angle, **extra)


def movement_turn(previous: dict | None, current: dict, following: dict | None) -> float:
    if not previous or not following:
        return 0.0
    incoming = math.degrees(math.atan2(current["y"] - previous["y"], current["x"] - previous["x"]))
    outgoing = math.degrees(math.atan2(following["y"] - current["y"], following["x"] - current["x"]))
    return abs(signed_delta(incoming, outgoing))


def convert_circle(obj: dict, previous: dict | None, following: dict | None, cfg: dict, angle: float, available: float) -> list[dict]:
    rank = cfg["rank"]
    burst = obj.get("burst", 1)
    turn = movement_turn(previous, obj, following)
    if burst > 1:
        if rank >= 6 and available >= .42:
            direction = 1 if (obj["sourceIndex"] // 2) % 2 == 0 else -1
            return [note(directional_type("scratch", direction), obj["beat"], angle, durationBeat=.34)]
        if rank >= 3:
            direction = 1 if obj["sourceIndex"] % 2 == 0 else -1
            return [note(directional_type("swing", direction), obj["beat"], angle)]
        if available >= .50:
            return [note("fx", obj["beat"], angle, durationBeat=min(.50, available))]
    if rank >= 4 and available >= .72 and obj["sourceIndex"] % 43 == 0:
        return [note("fx", obj["beat"], angle, durationBeat=min(.75, available))]
    accent_mod = {0: 999, 1: 12, 2: 18, 3: 12, 4: 9, 5: 7, 6: 5}[rank]
    threshold = {0: 181, 1: 140, 2: 145, 3: 135, 4: 125, 5: 120, 6: 112}[rank]
    if turn >= threshold and obj["sourceIndex"] % accent_mod == 0:
        cross = ((obj["x"] - previous["x"]) * (following["y"] - obj["y"])
                 - (obj["y"] - previous["y"]) * (following["x"] - obj["x"]))
        return [note(directional_type("swing", 1 if cross >= 0 else -1), obj["beat"], angle)]
    return [note("cut", obj["beat"], angle)]


def reverse_pair(obj: dict, cfg: dict, angle: float, sweep: float, next_gap: float) -> list[dict] | None:
    rank = cfg["rank"]
    if rank < 3 or next_gap < .74:
        return None
    emphasized = rank >= 4 and (obj["sourceIndex"] % 2 == 0)
    if rank == 6:
        emphasized = 24900 <= obj["time"] <= 28400 or 64900 <= obj["time"] <= 70000 or obj["time"] >= 80000
    if not emphasized:
        return None
    magnitude = max(cfg["quantum"] * 2, min(90.0 if rank < 6 else 112.5, abs(sweep)))
    first_sweep = magnitude if sweep >= 0 else -magnitude
    first_duration = .34 if rank >= 5 else .42
    first = motion_note("slide", obj["beat"], angle, first_sweep, first_duration, cfg["quantum"])
    second_beat = obj["beat"] + .48
    if next_gap >= .95 and rank >= 5:
        second = motion_note("slide", second_beat, first["endAngle"], -first_sweep, .34, cfg["quantum"])
    else:
        second = note(directional_type("swing", -first_sweep), second_beat, first["endAngle"])
    return [first, second]


def convert_slider(obj: dict, cfg: dict, angle: float, next_gap: float) -> list[dict]:
    rank, quantum = cfg["rank"], cfg["quantum"]
    available = max(0.0, next_gap - .12)
    source_duration = obj["durationBeat"]
    sweep = slider_sweep(obj, angle, quantum)
    if obj["repeats"] > 1:
        pair = reverse_pair(obj, cfg, angle, sweep, next_gap)
        if pair:
            return pair
        if rank <= 1:
            if rank == 1 and obj["sourceIndex"] % 4 == 0:
                return [note(directional_type("swing", -sweep), obj["beat"], angle)]
            if source_duration >= 1.0 and available >= .45:
                return [note("fx", obj["beat"], angle, durationBeat=min(1.5, available))]
            return [note("cut", obj["beat"], angle)]
        direction = -sweep if obj["sourceIndex"] % 2 else sweep
        return [note(directional_type("swing", direction), obj["beat"], angle)]

    short = source_duration <= .62
    technical_window = cfg["slug"] == "reverb" and (27300 <= obj["time"] <= 28400 or 74900 <= obj["time"] <= 85000 or 91600 <= obj["time"] <= 98400)
    if short:
        if rank == 0:
            return [note("cut", obj["beat"], angle)]
        if available >= .36 and abs(sweep) >= quantum * 2 and (obj["sourceIndex"] + rank) % max(2, 6 - rank) == 0:
            return [motion_note("slide", obj["beat"], angle, max(-120, min(120, sweep)), min(.5, available), quantum)]
        if rank >= 3 and (obj["sharp"] or technical_window or obj["sourceIndex"] % 4 == 0):
            return [note(directional_type("swing", sweep), obj["beat"], angle)]
        return [note("cut", obj["beat"], angle)]

    if rank == 0:
        if available >= .75 and abs(sweep) >= 45 and obj["sourceIndex"] % 5 == 0:
            return [motion_note("slide", obj["beat"], angle, max(-90, min(90, sweep)), min(source_duration, available, 1.5), quantum)]
        if source_duration >= 1.0 and available >= .5 and obj["sourceIndex"] % 3 == 0:
            return [note("fx", obj["beat"], angle, durationBeat=min(source_duration, available, 1.5))]
        return [note("cut", obj["beat"], angle)]

    wants_trace = rank >= 2 and (obj["sharp"] or (obj["curve"] in {"B", "P"} and abs(sweep) >= quantum * 3 and obj["sourceIndex"] % 3 == 0))
    if cfg["slug"] == "reverb" and (obj["sharp"] or technical_window):
        wants_trace = True
    if wants_trace and available >= .48:
        max_sweep = {2: 180, 3: 225, 4: 270, 5: 360, 6: 360}[rank]
        trace_sweep = max(-max_sweep, min(max_sweep, sweep))
        if abs(trace_sweep) < quantum * 2:
            trace_sweep = quantum * 2 * (1 if sweep >= 0 else -1)
        minimum_duration = max(.48, abs(trace_sweep) / (300.0 if rank >= 4 else 240.0))
        duration = min(max(minimum_duration, min(source_duration, 1.5)), available)
        if duration >= minimum_duration - .01:
            trace_note = motion_note("trace", obj["beat"], angle, trace_sweep, duration, quantum)
            # Reverb's spacious sharp reversals explicitly teach TRACE -> SWING.
            if rank == 6 and technical_window and next_gap - duration >= .34:
                swing_beat = obj["beat"] + duration + .12
                return [trace_note, note(directional_type("swing", -trace_sweep), swing_beat, trace_note["endAngle"])]
            return [trace_note]

    if available >= .34 and abs(sweep) >= quantum:
        max_sweep = 90 if rank <= 1 else (135 if rank <= 3 else 180)
        return [motion_note("slide", obj["beat"], angle, max(-max_sweep, min(max_sweep, sweep)), min(source_duration, available, 1.75), quantum)]
    if rank >= 2:
        return [note(directional_type("swing", sweep), obj["beat"], angle)]
    return [note("cut", obj["beat"], angle)]


def convert_spinner(obj: dict, cfg: dict, angle: float, next_gap: float) -> list[dict]:
    rank, quantum = cfg["rank"], cfg["quantum"]
    duration = min(obj["durationBeat"], max(.5, next_gap - .12))
    if rank == 0 and obj["time"] != 11645:
        return [note("fx", obj["beat"], angle, durationBeat=min(duration, 2.0))]
    if rank == 1 and obj["sourceIndex"] % 2:
        return [note("fx", obj["beat"], angle, durationBeat=min(duration, 2.5))]
    if rank == 4 and obj["sourceIndex"] % 4 == 0:
        return [note("fx", obj["beat"], angle, durationBeat=min(duration, 2.0))]
    if rank == 4 and obj["sourceIndex"] % 4 == 1:
        direction = 1 if obj["sourceIndex"] % 2 == 0 else -1
        return [note(directional_type("scratch", direction), obj["beat"], angle, durationBeat=.55)]
    turns = 90 if rank == 0 else (180 if rank <= 2 else (360 if rank <= 4 else 540))
    if duration >= 5 and rank >= 5:
        turns = 720
    direction = 1 if obj["sourceIndex"] % 2 == 0 else -1
    return [motion_note("trace", obj["beat"], angle, direction * turns, duration, quantum)]


def priority(note_data: dict) -> int:
    kind = note_data["type"]
    if kind.startswith("trace"):
        return 6
    if kind.startswith("slide"):
        return 5
    if kind.startswith("scratch"):
        return 4
    if kind.startswith("swing"):
        return 3
    if kind == "fx":
        return 2
    return 1


def deduplicate(notes: list[dict]) -> list[dict]:
    groups: dict[float, list[dict]] = collections.defaultdict(list)
    for note_data in notes:
        groups[round(note_data["beat"], 3)].append(note_data)
    result = []
    for beat in sorted(groups):
        group = groups[beat]
        result.append(max(group, key=priority))
    return result


def trim_durations(notes: list[dict]) -> list[dict]:
    result = []
    minimum = {"fx": .34, "slide": .30, "trace": .45, "scratch": .30}
    for index, current in enumerate(notes):
        family = "trace" if current["type"].startswith("trace") else "slide" if current["type"].startswith("slide") else "scratch" if current["type"].startswith("scratch") else current["type"]
        if "durationBeat" in current and index + 1 < len(notes):
            allowed = notes[index + 1]["beat"] - current["beat"] - .08
            current = dict(current)
            current["durationBeat"] = round(min(current["durationBeat"], allowed), 3)
            if current["durationBeat"] < minimum.get(family, 0):
                direction = -1 if current["type"].endswith("CCW") else 1
                current = note(directional_type("swing", direction), current["beat"], current["angle"]) if family != "fx" else note("cut", current["beat"], current["angle"])
        result.append(current)
    return result


def shape_angles(notes: list[dict], cfg: dict) -> None:
    previous_end = None
    previous_end_beat = None
    for current in notes:
        original_start = current["angle"]
        if previous_end is not None:
            gap = current["beat"] - previous_end_beat
            if gap <= .26:
                max_jump = 75 if cfg["rank"] <= 1 else (105 if cfg["rank"] <= 3 else 120)
            elif gap <= .51:
                max_jump = 105 if cfg["rank"] <= 1 else (135 if cfg["rank"] <= 3 else 150)
            else:
                max_jump = 180
            if current["type"].startswith("trace") and gap < 1.2:
                max_jump = min(max_jump, 90)
            delta = signed_delta(previous_end, original_start)
            if abs(delta) > max_jump:
                current["angle"] = quantize(previous_end + math.copysign(max_jump, delta), cfg["quantum"])
                if "signedSweepAngle" in current:
                    current["endAngle"] = quantize(current["angle"] + current["signedSweepAngle"], cfg["quantum"])
                elif current["type"].startswith("slide") and "endAngle" in current:
                    slide_delta = signed_delta(original_start, current["endAngle"])
                    if current["type"].endswith("CW") and slide_delta <= 0:
                        slide_delta += 360
                    if current["type"].endswith("CCW") and slide_delta >= 0:
                        slide_delta -= 360
                    current["endAngle"] = quantize(current["angle"] + slide_delta, cfg["quantum"])
        if "signedSweepAngle" in current:
            previous_end = normalize_angle(current["angle"] + current["signedSweepAngle"])
        else:
            previous_end = current.get("endAngle", current["angle"])
        previous_end_beat = current["beat"] + current.get("durationBeat", 0)


def convert_chart(beatmap: dict, cfg: dict) -> dict:
    source_objects = beatmap["objects"]
    objects = consolidate_objects(source_objects, cfg["min_gap"])
    notes = []
    previous_angle = 0.0
    for index, obj in enumerate(objects):
        previous_obj = objects[index - 1] if index else None
        following_obj = objects[index + 1] if index + 1 < len(objects) else None
        angle = position_angle((obj["x"], obj["y"]), previous_angle, cfg["quantum"])
        previous_angle = angle
        if following_obj:
            next_gap = following_obj["beat"] - obj["beat"]
        elif obj["kind"] == "spinner":
            next_gap = obj["durationBeat"] + .2
        else:
            next_gap = 4.0
        available = max(0.0, next_gap - .12)
        if obj["kind"] == "circle":
            converted = convert_circle(obj, previous_obj, following_obj, cfg, angle, available)
        elif obj["kind"] == "slider":
            converted = convert_slider(obj, cfg, angle, next_gap)
        else:
            converted = convert_spinner(obj, cfg, angle, next_gap)
        notes.extend(converted)
    notes = trim_durations(deduplicate(notes))
    shape_angles(notes, cfg)
    for index, note_data in enumerate(notes):
        note_data["id"] = f"routing-{cfg['slug']}-{index + 1:03d}"
    counts = collections.Counter(note_data["type"] for note_data in notes)
    families = collections.Counter(
        "trace" if key.startswith("trace") else "slide" if key.startswith("slide") else "swing" if key.startswith("swing")
        else "scratch" if key.startswith("scratch") else "hold" if key == "fx" else "cut"
        for key in counts for _ in range(counts[key])
    )
    return {
        "difficulty": cfg["slug"],
        "label": cfg["label"],
        "bpm": BPM,
        "offset": 0,
        "stars": cfg["stars"],
        "schema": "angle-v1",
        "notes": notes,
        "analysis": {
            "sourceObjectCount": len(source_objects),
            "circleMixNoteCount": len(notes),
            "typeCounts": dict(sorted(families.items())),
        },
    }


def validate_bundle(bundle: dict) -> None:
    valid = {"cut", "fx", "slideCW", "slideCCW", "traceCW", "traceCCW", "swingCW", "swingCCW", "scratchCW", "scratchCCW"}
    for difficulty, chart in bundle["charts"].items():
        previous_beat = -1.0
        for index, current in enumerate(chart["notes"]):
            assert current["type"] in valid, (difficulty, index, current)
            assert math.isfinite(current["beat"]) and current["beat"] >= 0, (difficulty, index, "beat")
            assert current["beat"] > previous_beat, (difficulty, index, "not strictly sorted")
            assert math.isfinite(current["angle"]) and 0 <= current["angle"] < 360, (difficulty, index, "angle")
            if "durationBeat" in current:
                assert math.isfinite(current["durationBeat"]) and current["durationBeat"] > 0, (difficulty, index, "duration")
            if "endAngle" in current:
                assert math.isfinite(current["endAngle"]) and 0 <= current["endAngle"] < 360, (difficulty, index, "end angle")
            if current["type"].startswith("trace"):
                assert math.isfinite(current["signedSweepAngle"]) and current["signedSweepAngle"] != 0, (difficulty, index, "trace travel")
                seconds = current["durationBeat"] * 60 / BPM
                required = abs(current["signedSweepAngle"])
                minimum = min(max(required / 180 * .30, .12), .40)
                assert seconds + 1e-6 >= min(minimum, max(.06, seconds * .72)), (difficulty, index, "trace duration")
            previous_beat = current["beat"]


def build(input_path: pathlib.Path) -> dict:
    maps = {}
    with zipfile.ZipFile(input_path) as archive:
        for filename in archive.namelist():
            if not filename.lower().endswith(".osu"):
                continue
            beatmap = parse_beatmap(archive.read(filename).decode("utf-8-sig"))
            maps[beatmap["metadata"]["Version"]] = beatmap
    assert set(maps) == set(ORDER), f"expected {ORDER}, found {sorted(maps)}"
    charts = {CONFIG[name]["slug"]: convert_chart(maps[name], CONFIG[name]) for name in ORDER}
    difficulties = {
        CONFIG[name]["slug"]: {
            "label": CONFIG[name]["label"],
            "chart": f"builtin:routing-{CONFIG[name]['slug']}",
            "stars": CONFIG[name]["stars"],
        }
        for name in ORDER
    }
    bundle = {
        "song": {
            "id": "routing",
            "source": "builtin",
            "title": "Routing",
            "artist": "Camellia",
            "bpm": BPM,
            "offset": 0,
            "previewStart": 50,
            "previewDuration": 15,
            "audio": None,
            "audioRequired": True,
            "audioStorageKey": "routing",
            "audioNotice": "Audio is not distributed with CIRCLE MIX. Link a legally obtained local copy to play.",
            "jacket": None,
            "difficulties": difficulties,
        },
        "charts": charts,
        "conversion": {
            "source": "osu! beatmap set 663255, parsed locally from excluded reference-input",
            "policy": "Rhythm and geometry adaptation; micro-bursts are consolidated and sliders/reverses are re-authored as CUT, HOLD, SLIDE, TRACE, SWING, or rare SCRATCH gestures.",
            "audio": "No source audio, artwork, .osu, .osz, samples, or other original resource is included.",
        },
    }
    validate_bundle(bundle)
    return bundle


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=pathlib.Path, default=DEFAULT_INPUT)
    parser.add_argument("--check", action="store_true", help="Validate without writing generated files")
    args = parser.parse_args()
    bundle = build(args.input)
    if args.check:
        print(json.dumps({key: value["analysis"] for key, value in bundle["charts"].items()}, indent=2))
        return
    data_path = ROOT / "data" / "routing-charts.json"
    runtime_path = ROOT / "src" / "charts" / "routing.js"
    payload = json.dumps(bundle, ensure_ascii=False, separators=(",", ":"))
    data_path.write_text(json.dumps(bundle, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    runtime_path.write_text("// Generated by scripts/build-routing-charts.py; original resources are not embedded.\n"
                            f"window.CircleMixRoutingBundle={payload};\n", encoding="utf-8", newline="\n")
    print(json.dumps({key: value["analysis"] for key, value in bundle["charts"].items()}, indent=2))


if __name__ == "__main__":
    main()
