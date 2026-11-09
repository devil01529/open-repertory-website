import importlib.util,tempfile,json,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('b',Path(__file__).resolve().parents[1]/'scripts/build_clinical_website.py');b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
class Tests(unittest.TestCase):
 def test_copy_preserves_clinical_data(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d);s=p/'source';(s/'data').mkdir(parents=True);(s/'css').mkdir()
   (s/'data/book.json').write_text('{"grade":4}');(s/'index.html').write_text('<head></head>');o=p/'output'
   r=b.build(s,o);self.assertEqual((o/'data/book.json').read_bytes(),(s/'data/book.json').read_bytes())
   self.assertIn('glass-web.css',(o/'index.html').read_text());self.assertFalse(r['clinical_logic_changed'])
   with self.assertRaises(ValueError):b.build(s,o)
 def test_public_destination_rejected(self):
  with self.assertRaises(ValueError):b.build(Path('/unused'),b.ROOT/'must-not-create')
if __name__=='__main__':unittest.main()
