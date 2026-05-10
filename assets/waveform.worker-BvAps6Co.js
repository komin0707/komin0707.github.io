(function() {
	const t = (t, n, e) => Math.min(e, Math.max(n, t)), n = (n, e, i, o) => (1 - t((n - e) / (i - e), 0, 1)) * o;
	function e(t) {
		const { kind: n, settings: e } = t, o = function({ scenario: t, settings: n, t: e }) {
			const i = Math.min(.6, n.inspiratoryTime / (60 / n.respiratoryRate)), o = .38 * i;
			return {
				inspiration: e < i,
				inspirationRatio: i,
				obstruction: "airwayObstruction" === t.type,
				plateau: e >= o && e < i,
				pressureRampEnd: o
			};
		}(t);
		if ("co2" === n) return function({ t, vitals: n }, e) {
			if (t < e.inspirationRatio) return 0;
			const o = i(t, e.inspirationRatio);
			return o < .16 ? n.etco2 * (o / .16) ** 1.8 : o < .78 ? n.etco2 - 2 + o * (e.obstruction ? 8 : 2) : n.etco2 * Math.max(0, 1 - (o - .78) / .22);
		}(t, o);
		if ("HFOV" === e.mode) return function({ kind: t, settings: n, t: e, vitals: i }) {
			const o = Math.sin(e * Math.PI * 24);
			return "pressure" === t ? n.peep + 12 + 6 * o : "flow" === t ? o * n.flow * .55 : .35 * i.vte + Math.sin(e * Math.PI * 24 + Math.PI / 2) * i.vte * .08;
		}(t);
		if ("APRV" === e.mode) return function({ kind: t, settings: n, t: e, vitals: i }) {
			const o = e < .78;
			return "pressure" === t ? o ? n.peep + 22 : n.peep + 2 : "flow" === t ? o ? .18 * n.flow : 1.05 * -n.flow : o ? .82 * i.vte : i.vte * Math.exp(-(e - .78) / .22 * 4);
		}(t);
		if ("BiPAP" === e.mode || "NIV" === e.mode) {
			const n = function({ kind: t, settings: n }, e) {
				return "pressure" === t ? e.inspiration ? n.peep + ("BiPAP" === n.mode ? 12 : 8) : n.peep + 3 : "flow" === t ? e.inspiration ? .62 * n.flow : .54 * -n.flow : void 0;
			}(t, o);
			if (void 0 !== n) return n;
		}
		return "SIMV" === e.mode && "pressure" === n && function({ t }, n) {
			return !n.inspiration && t > .58 && t < .66;
		}(t, o) ? e.peep + 5 : "pressure" === n ? function({ settings: t, t: n, vitals: e }, o) {
			if (n < o.pressureRampEnd) return t.peep + n / Math.max(o.pressureRampEnd, .01) * (e.pip - t.peep);
			if (o.plateau) return e.plateau;
			const r = i(n, o.inspirationRatio);
			return t.peep + (e.plateau - t.peep) * Math.exp(5 * -r);
		}(t, o) : "flow" === n ? function({ settings: t, t: n }, e) {
			if (e.inspiration) return t.flow;
			const o = i(n, e.inspirationRatio);
			return .8 * -t.flow * Math.exp(3 / (e.obstruction ? 1.8 : 1) * -o);
		}(t, o) : function({ t, vitals: n }, e) {
			if (e.inspiration) return n.vte * (t / Math.max(e.inspirationRatio, .01));
			const o = i(t, e.inspirationRatio);
			return n.vte * Math.exp(-o * (e.obstruction ? 2.4 : 3.5));
		}(t, o);
	}
	function i(t, n) {
		return (t - n) / Math.max(1 - n, .01);
	}
	function o({ kind: i, vitals: o, scenario: r, settings: s, phase: a, paused: p, historyOffsetSeconds: u = 0, width: f = 330, height: c = 88, zoom: d = 1 }) {
		const l = [], h = u / (60 / Math.max(1, s.respiratoryRate)), m = (p ? Math.floor(10 * a) / 10 : a) - h, M = 31 * t(d, 1, 4);
		for (let t = 0; t < 96; t += 1) {
			const a = t / 95 * f, p = e({
				kind: i,
				scenario: r,
				settings: s,
				t: ((t / M + m) % 1 + 1) % 1,
				vitals: o
			}), u = "pressure" === i ? n(p, -5, Math.max(45, o.pip + 8), c) : "flow" === i ? n(p, -90, 90, c) : n(p, 0, "volume" === i ? Math.max(800, o.vte + 220) : Math.max(60, o.etco2 + 16), c);
			l.push({
				x: a,
				y: u
			});
		}
		return l;
	}
	const r = self;
	function s() {
		if ("undefined" == typeof OffscreenCanvas) return !1;
		try {
			return !!new OffscreenCanvas(1, 1).getContext("2d");
		} catch {
			return !1;
		}
	}
	r.addEventListener("message", (t) => {
		const { id: n, options: e } = t.data, i = {
			id: n,
			offscreenCanvasSupported: s(),
			polyline: (a = o(e), a.map((t) => `${t.x.toFixed(1)},${t.y.toFixed(1)}`).join(" "))
		};
		var a;
		r.postMessage(i);
	});
})();
