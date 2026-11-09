(function (root) {
  'use strict';
  const policy = {
    initials(value) {
      const result = String(value || '').replace(/[.\s]/g, '').toUpperCase();
      if (!/^[A-Z]{1,4}$/.test(result)) throw Error('Use 1–4 initials only, without a patient name.');
      return result;
    },
    oldest(cases) {
      return Object.values(cases).sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0) || a.id.localeCompare(b.id))[0];
    },
    async makeRoom(app) {
      if (Object.keys(app.state.cases).length < 5) return true;
      const oldest = policy.oldest(app.state.cases);
      if (!await app.confirm('Five-case limit', 'Creating another case will permanently delete the oldest case (' + oldest.name + ') and its analysis, notes and snapshots. Cancel keeps all five cases.', 'Delete oldest & continue')) return false;
      // Recheck after the dialog: a concurrent action must not delete a different case.
      if (policy.oldest(app.state.cases)?.id !== oldest.id) throw Error('Cases changed. Please try again.');
      delete app.state.cases[oldest.id];
      return true;
    },
    validateWrites(values) {
      if (Object.keys(values).some(k => /patient|draft|preimport/i.test(k))) throw Error('Patient profiles and legacy record imports are unavailable on this website.');
      const saved = values.openrepertory_cases;
      if (!saved) return;
      const cases = Object.values(saved.cases || {});
      if (cases.length > 5) throw Error('Only five cases can be saved. Create a case through the confirmation dialog.');
      for (const c of cases) {
        policy.initials(c.name);
        if (c.patientId || c.patient || c.phone || c.email || c.address || c.dob) throw Error('Patient details cannot be saved in this workspace.');
      }
    }
  };
  root.ORCasePolicy = policy;
})(globalThis);
