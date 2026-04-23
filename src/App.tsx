import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { type OnMount } from '@monaco-editor/react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Vault } from './services/vault';
import { askZecur } from './services/zecurBrain';
import 'xterm/css/xterm.css';

const initialFiles = [
  { name: 'main.js', content: 'console.log("Zecur IDE Active");' },
  { name: 'utils.js', content: '// Tambahkan fungsi di sini' }
];

const App = () => {
  const [files, setFiles] = useState(initialFiles);
  const [activeFile, setActiveFile] = useState(initialFiles[0]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<Terminal | null>(null);

  useEffect(() => {
    const term = new Terminal({ 
      theme: { background: '#1e1e1e' }, 
      cursorBlink: true,
      convertEol: true // Memperbaiki baris baru di terminal
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    if (terminalRef.current) {
      term.open(terminalRef.current);
      fitAddon.fit();
      term.writeln('\x1b[1;34m[ZECUR OS v0.1.0]\x1b[0m');
      term.writeln('Ketik "Zecur: add [KEY]" untuk memulai.');
      term.write('\x1b[32m$ \x1b[0m');
    }

    let currentLine = '';
    const disposable = term.onData(async (data) => {
      if (data === '\r') { // Tombol Enter
        term.write('\r\n');
        await handleCommand(currentLine, term);
        currentLine = '';
        term.write('\x1b[32m$ \x1b[0m');
      } else if (data === '\u007f') { // Backspace
        if (currentLine.length > 0) {
          currentLine = currentLine.slice(0, -1);
          term.write('\b \b');
        }
      } else {
        currentLine += data;
        term.write(data);
      }
    });

    xtermInstance.current = term;
    return () => {
      disposable.dispose();
      term.dispose();
    };
  }, []);

  const handleCommand = async (command: string, term: Terminal) => {
    const cmd = command.trim();

    if (cmd.startsWith('Zecur: add ')) {
      const key = cmd.replace('Zecur: add ', '');
      Vault.saveKey(key);
      term.writeln('\x1b[32m[Vault]\x1b[0m API_KEY disimpan.');
    } 
    else if (cmd === 'Zecur: check API_KEY') {
      term.writeln('Mengecek koneksi ke satelit AI...');
      try {
        await askZecur("ping", []);
        term.writeln('\x1b[32m[Online]\x1b[0m Zecur Brain terhubung!');
      } catch (e: any) {
        term.writeln(`\x1b[31m[Offline]\x1b[0m Error: ${e.message}`);
      }
    }
    else if (cmd === 'Zecur: choose Model_Ai') {
      term.writeln('\n\x1b[33mMODEL TERSEDIA:\x1b[0m');
      term.writeln('- gemini-1.5-pro');
      term.writeln('- gemini-1.5-flash');
      term.writeln('\nKetik: Zecur: set_model [nama_model]');
    }
    else if (cmd.startsWith('Zecur: set_model ')) {
      const model = cmd.replace('Zecur: set_model ', '');
      Vault.saveModel(model);
      term.writeln(`\x1b[32m[Vault]\x1b[0m Model dialihkan ke ${model}`);
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, async () => {
      const model = editor.getModel();
      const selection = editor.getSelection();
      if (!model || !selection) return;

      const prompt = model.getValueInRange(selection);
      xtermInstance.current?.writeln(`\x1b[36m[AI]\x1b[0m Memproses kode...`);
      
      try {
        const response = await askZecur(prompt, files);
        editor.executeEdits("ZecurAI", [{ range: selection, text: response, forceMoveMarkers: true }]);
        xtermInstance.current?.writeln(`\x1b[32m[AI]\x1b[0m Selesai.`);
      } catch (err: any) {
        xtermInstance.current?.writeln(`\x1b[31m[AI Error]\x1b[0m ${err.message}`);
      }
    });
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: '200px', background: '#252526', color: '#ccc', padding: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px', color: '#858585' }}>ZECUR EXPLORER</div>
          {files.map(f => (
            <div 
              key={f.name} 
              onClick={() => setActiveFile(f)} 
              style={{ 
                cursor: 'pointer', 
                padding: '6px 8px', 
                fontSize: '13px',
                background: activeFile.name === f.name ? '#37373d' : 'transparent',
                borderRadius: '4px'
              }}
            >
              {f.name}
            </div>
          ))}
        </div>
        {/* Editor */}
        <div style={{ flex: 1 }}>
          <Editor
            height="100%"
            theme="vs-dark"
            path={activeFile.name}
            defaultLanguage="javascript"
            value={activeFile.content}
            onMount={handleEditorDidMount}
            onChange={(v: string | undefined) => setFiles(prev => prev.map(f => f.name === activeFile.name ? {...f, content: v || ''} : f))}
            options={{ minimap: { enabled: false }, fontSize: 14 }}
          />
        </div>
      </div>
      {/* Terminal */}
      <div style={{ height: '200px', borderTop: '1px solid #333' }}>
        <div ref={terminalRef} style={{ height: '100%' }} />
      </div>
    </div>
  );
};

export default App;
