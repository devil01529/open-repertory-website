from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class WebRefinements(unittest.TestCase):
 def test_platform_login_and_no_password_form(self):
  s=(ROOT/'website/web-controls.js').read_text()
  self.assertIn('/signin-with-chatgpt',s)
  self.assertIn('/signout-with-chatgpt',s)
  self.assertNotIn('type="password"',s)
  self.assertNotIn('localStorage',s)
 def test_legal_access_is_centralized_not_deleted(self):
  s=(ROOT/'website/web-controls.js').read_text()
  self.assertIn('OR.openSourceCredits()',s)
  self.assertIn('sources[Number(button.dataset.legalChoice)].click()',s)
  self.assertIn('[data-mm-credits] { display:none!important; }',(ROOT/'website/glass-web.css').read_text())
 def test_performance_overlay(self):
  s=(ROOT/'website/glass-web.css').read_text()
  self.assertIn('backdrop-filter:none!important',s)
  self.assertIn('.nav-selection { display:none!important; }',s)
  self.assertIn('return false; // Web:',(ROOT/'scripts/package_static_site.py').read_text())
 def test_browser_referrer_policy(self):
  self.assertIn('name="referrer" content="no-referrer"',(ROOT/'scripts/package_static_site.py').read_text())
if __name__=='__main__':unittest.main()
