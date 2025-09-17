import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormControl } from '@angular/forms';
import { CurrentdateService } from '../currentdate.service';
import { OllamaServiceService } from '../ollama-service.service';
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js';
import { Marked } from "marked";
import DOMPurify from 'dompurify';
import { IndexeddbService } from '../indexeddb.service';
import { SessionstorageserviceService } from "../sessionstorageservice.service"
import { Router } from '@angular/router';
import { DialogOllamaSettingsComponent } from '../dialog-ollama-settings/dialog-ollama-settings.component';
import { MatTooltip } from '@angular/material/tooltip';
import { UtilsService } from '../utils.service';

@Component({
  selector: 'app-dialog-ollama',
  standalone: false,
  //imports: [],
  templateUrl: './dialog-ollama.component.html',
  styleUrls: ['./dialog-ollama.component.scss']
})
export class DialogOllamaComponent implements OnInit {


  @ViewChild('tooltip') tooltip: MatTooltip;
  @ViewChild('tooltip2') tooltip2: MatTooltip;
  chatmsg: any = [];

  questioninput = new UntypedFormControl();
  aiselectedValue: string;
  ai_tags: any = [];
  models: any;
  aiconnected = false;
  ollamaurl = "http://localhost:11434";
  temperature = 0.7;
  attachedIMG: any = [];
  attachedIMG_b64: any = [];
  attachedFILES: any = [];
  myrep = false;
  defaultprompt = "You are a helpful cyber security assistant.";
  // @ts-ignore
  constructor(public dialogRef: MatDialogRef<DialogOllamaComponent>, @Inject(MAT_DIALOG_DATA) public data: any,
    private currentdateService: CurrentdateService, private ollamaService: OllamaServiceService,
    private indexeddbService: IndexeddbService, private sessionsub: SessionstorageserviceService,
    public router: Router, public dialog: MatDialog, private utilsService: UtilsService) {

  }


  ngOnInit() {

    this.indexeddbService.getkeybyAiintegration().then(ret => {

      if (ret[0]) {
        this.models = ret[0];

        this.aiselectedValue = this.models.model;
        this.ollamaurl = this.models.ollama_url;
        this.temperature = this.models.temperature;
        this.defaultprompt = this.models.defaultprompt;

      } else {

        this.router.navigate(['/settings']);
        this.dialogRef.close();
      }
    });

    this.ollamaService.checktags(this.ollamaurl).then(resp => {

      if (resp) {
        this.ai_tags = resp.models;
        this.aiconnected = true;
      } else {
        this.router.navigate(['/settings']);
        this.dialogRef.close();
      }
    });

    const localchat = this.sessionsub.getSessionStorageItem('VULNREPO-OLLAMA-CHAT');

    if (localchat) {
      this.chatmsg = JSON.parse(localchat);
    }



    if (this.data) {


      if (this.data[0]) {

        if (this.data[0].prompt === '') {
          this.myrep = true;
        }


        if (this.data[0].files.length > 0) {
          this.attachedFILES = this.data[0].files;
        }
      }

    }

  }

  sendmsg() {

    const inputmsg = this.questioninput.value;
    const attarr = this.attachedIMG;
    const attarr_b64 = this.attachedIMG_b64;
    const attfiles = this.attachedFILES;

    this.questioninput.setValue('');
    this.attachedIMG = [];
    this.attachedIMG_b64 = [];
    this.attachedFILES = [];



    if (inputmsg !== null && inputmsg !== '') {

      this.chatmsg.push({ "question": inputmsg, "response": "", "response_md": "", "aitime": "", "date": String(this.currentdateService.getcurrentDate()), "model": this.aiselectedValue, "temperature": this.temperature, "images": attarr, "files": attfiles });

      const marked = new Marked(
        markedHighlight({
          emptyLangClass: 'hljs',
          langPrefix: 'hljs language-',
          highlight(code, lang, info) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
          }
        })
      );
      const renderer = new marked.Renderer();

      renderer.code = function (token) {
        return `<pre class="hljs"><code>` + DOMPurify.sanitize(token.text) + `</code></pre>`;
      };

      renderer.blockquote = function (token) {
        return `<blockquote><p>` + DOMPurify.sanitize(token.text) + `</p></blockquote>`;
      };

      function millisToMinutesAndSeconds(millis) {
        var minutes = Math.floor(millis / 60000);
        var seconds = Number(((millis % 60000) / 1000).toFixed(0));
        return (
          seconds == 60 ?
            (minutes + 1) + ":00" :
            minutes + ":" + (seconds < 10 ? "0" : "") + seconds
        );
      }

      let temps = "";
      let start = performance.now();
      //this.updatemsg('user', inputmsg);
      this.ollamaService.chatStream(this.ollamaurl, inputmsg, this.aiselectedValue, attarr_b64, attfiles, this.defaultprompt).subscribe({
        next: (text) => {
          this.chatmsg[this.chatmsg.length - 1].response += text;
          temps += text;

          if (text.includes(".\n") || text.includes(". \n")) {
            this.chatmsg[this.chatmsg.length - 1].response = marked.parse(this.chatmsg[this.chatmsg.length - 1].response, { renderer: renderer });
          }

          //scroll bottom
          const element = document.getElementById('chat');
          if (element) {
            element.scrollTop = element.scrollHeight;
          }


        },
        complete: () => {
          console.log('AI end chat');


          this.chatmsg[this.chatmsg.length - 1].response_md = temps;

          if (temps.includes('<think>')) {
            temps = temps.replaceAll(/<think>/g, "<details class='think'><summary>Think details</summary>").replaceAll(/<\/think>/gi, "</details><br>");
          }

          this.chatmsg[this.chatmsg.length - 1].response = marked.parse(temps, { renderer: renderer });

          const end = millisToMinutesAndSeconds(performance.now() - start);

          this.chatmsg[this.chatmsg.length - 1].aitime = end;

          this.sessionsub.setSessionStorageItem('VULNREPO-OLLAMA-CHAT', JSON.stringify(this.chatmsg));


          this.updatemsg('assistant', temps);


        },
        error: () => {

        }
      });

    } else {
      this.questioninput.setErrors({ 'notempty': true });
    }


  }

  updatemsg(role, msg) {
    const localchat = this.sessionsub.getSessionStorageItem('VULNREPO-OLLAMA-CHAT-MSG-H');
    let tarr: any = [];
    if (localchat) {
      tarr = JSON.parse(localchat);
    }

    tarr.push({ "role": role, "content": msg });

    this.sessionsub.setSessionStorageItem('VULNREPO-OLLAMA-CHAT-MSG-H', JSON.stringify(tarr));
  }

  closedialog(): void {
    this.dialogRef.close();
  }

  saniteizeme(code) {
    return DOMPurify.sanitize(code);
  }

  clearmsg() {
    this.chatmsg = [];
    this.sessionsub.removeSessionStorageItem('VULNREPO-OLLAMA-CHAT');
    this.sessionsub.removeSessionStorageItem('VULNREPO-OLLAMA-CHAT-MSG-H');
  }


  onImageLoad(fileLoadedEvent) { }

  onImageSelect(input: HTMLInputElement) {
    const files = input.files;
    if (files) {
      Object.keys(files).forEach(key => {

        const fileToRead = files[key];
        const fileReader = new FileReader();
        fileReader.onload = this.onImageLoad;

        fileReader.onload = (e) => {

          const res: string = fileReader.result as string;

          this.attachedIMG.push('data:image/png;base64,' + btoa(res));
          this.attachedIMG_b64.push(btoa(res));

        };

        fileReader.readAsBinaryString(fileToRead);

      });
    }

  }

  removeAttach() {
    this.attachedIMG = [];
    this.attachedIMG_b64 = [];
  }

  onFileLoad(fileLoadedEvent) { }

  onFileSelect(input: HTMLInputElement) {
    const files = input.files;

    if (files) {
      Object.keys(files).forEach(key => {

        const fileToRead = files[key];
        const fileReader = new FileReader();
        fileReader.onload = this.onImageLoad;

        fileReader.onload = (e) => {

          const res: string = fileReader.result as string;

          this.attachedFILES.push({ "filename": files[key].name, "date": String(this.currentdateService.getcurrentDate()), "filetype": files[key].type, "file": btoa(res) });

        };

        fileReader.readAsBinaryString(fileToRead);

      });
    }


  }

  removeAttachfile() {
    this.attachedFILES = [];
  }

  opensettings() {
    const dialogRef = this.dialog.open(DialogOllamaSettingsComponent, {
      width: '600px',
      disableClose: false,
      data: []
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The AI-Settings dialog was closed');

      this.indexeddbService.getkeybyAiintegration().then(ret => {

        if (ret[0]) {
          this.models = ret[0];

          this.aiselectedValue = this.models.model;
          this.ollamaurl = this.models.ollama_url;
          this.temperature = this.models.temperature;
          this.defaultprompt = this.models.defaultprompt;

        } else {

          this.router.navigate(['/settings']);
          this.dialogRef.close();
        }
      });

    });

  }

  copyTextuser() {
    setTimeout(() => {
      this.tooltip.show();
      this.tooltip.message = "Copied!";
    });
    setTimeout(() => {
      this.tooltip.hide();
      this.tooltip.message = "Copy to clipboard";
    }, 2000);
  }

  copyTextAI() {
    setTimeout(() => {
      this.tooltip2.show();
      this.tooltip2.message = "Copied!";
    });
    setTimeout(() => {
      this.tooltip2.hide();
      this.tooltip2.message = "Copy to clipboard";
    }, 2000);
  }

  downloadAIText(response) {

    // download JSON report
    const blob = new Blob([JSON.stringify(response)], { type: 'text/markdown' });
    const link = document.createElement('a');
    const url = window.URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'AI Response (vulnrepo.com) ' + String(this.currentdateService.getcurrentDate()) + '.md');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  }

  prepAIcopy(html) {
    return this.utilsService.removeHTMLTags(html);
  }


  useAIprompt(index) {

    const arr = [
      `I have attached a JSON report file, don't mention that file, which contains a list of vulnerabilities, please prepare a report summary and remediation's for a company CEO as a document, mention scope if provided on JSON key "report_scope", mention researcher if provided on JSON key "researcher".`,
      `I have attached a JSON report file, don't mention that file, which contains a list of vulnerabilities, please prepare a list remediation steps for provided issues.`,
      `I have attached a JSON report file, don't mention that file, which contains a list of vulnerabilities, please prepare a technical summary for developer with remediations.`,
      `I have attached a JSON report file, don't mention that file, which contains a list of vulnerabilities, please create a list with all issues.`,
      `I have attached a JSON report file, don't mention that file, which contains a list of vulnerabilities, Base on that file, what is the cost of fixing all issues? try estimate potential costs in dolars.`,
      `I have attached a JSON report file, don't mention that file, which contains a list of vulnerabilities, please select what kind a specialization and skills I need to have to solve these issues.`,
      `I have attached a JSON report file, don't mention that file, which contains a list of vulnerabilities, please describe report data like to 5 old child.`
    ];

    this.questioninput.setValue(arr[index]);

    this.sendmsg();



  }


}
