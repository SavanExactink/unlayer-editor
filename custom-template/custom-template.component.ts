import { Component, OnInit, Input, TemplateRef, ElementRef, ViewChild, OnDestroy, NgZone, Inject } from '@angular/core';
import { UserService, CampaignService, ApiService, CrmService, AdminService } from '../../core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
// import 'grapesjs-preset-webpage';
import { Router, ActivatedRoute } from '@angular/router';
import { EmailEditorComponent } from 'angular-email-editor';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../../environments/environment';
declare var $: any;
const misc: any = {
  navbar_menu_visible: 0,
  active_collapse: true,
  disabled_collapse_init: 0,
};
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'custom-template',
  templateUrl: './custom-template.component.html',
  styleUrls: ['./custom-template.component.css']
})
export class CustomTemplateComponent implements OnInit, OnDestroy {
  public isSaveNext: String = 'NO';
  @ViewChild('imageTemplate') templateRef: TemplateRef<any>;
  public tagsListArray = [];
  public _editor: any;
  name = 'Angular 6';
  @ViewChild(EmailEditorComponent)
  public emailEditor: EmailEditorComponent;
  public modalRef: BsModalRef;
  public config_invite_users = {
    backdrop: true,
    ignoreBackdropClick: true,
    class: 'modal-xl'
  };
  public currentUser: any;
  public jsonData: any;
  @Input() details: any;
  @Input() mode: any = 'edit';
  public isTemplateSubmitting: any = false;
  public isMaterTemplateSubmitting: any = false;
  public isSubmitting: any = false;
  public isFileSubmitting: any = false;
  public alerts: any = [];
  public param_id: any;
  public target_value: any;
  public projectId: any = environment.unlayer_project_id;
  public media_object: any = {};
  public image_id: any = 1;
  public config = {
    ignoreBackdropClick: true,
    class: 'modal-lg'
  };
  public cropper_config = {
    ignoreBackdropClick: true,
    class: 'modal-xl'
  };
  public tabs_css = 4;
  public temp_background_color = '#cccccc';
  public imageList: any = [];
  public options = {
    displayMode: 'web'
  }
  public templateForm: FormGroup;
  public modalForm: FormGroup;
  public rows: any = [];
  public editimage: any;
  public counts: any;
  public page_no: any = 0;
  public parameters: any = {
    keyword: '',
    pagination: {
        offset: 0,
        limit: 20
      },
    sort_by: {
      column_name: '',
      order_by: '',
    },
    filters: {
      status: '',
      media_category_id: '',
    }
  };
  public pages: any;
  public current_page: any = 1;
  public last_index: any;
  public imageSrc: any;
  public tools = {
    form: {
      properties: {
      fields: {
        editor: {
          data: {
            defaultFields: [
              {name: 'name', label: 'Name', type: 'text'},
              {name: 'email', label: 'Email', type: 'email'},
              {name: 'phone_number', label: 'Phone Number', type: 'text'},
              {name: 'message', label: 'Message', type: 'textarea'},
              {name: 'cell_phone', label: 'Cell Phone', type: 'text'},
              {name: 'website_url', label: 'Website URL', type: 'text'},
              {name: 'business', label: 'Business', type: 'text'},
              {name: 'zipcode', label: 'Zip Code', type: 'text'},
              {name: 'street', label: 'Street', type: 'text'},
              {name: 'city', label: 'City', type: 'text'},
              {name: 'state', label: 'State', type: 'text'},
              {name: 'is_news_letter', label: 'News letter', type: 'checkbox', 'options': 'Subscribe to Newsletter'}
            ]
          }
        },
        value: [{
          'name': 'name',
          'type': 'text',
          'label': 'Name',
          'placeholder_text': 'Enter name here',
          'show_label': true,
          'required': true
        }, {
          'name': 'email',
          'type': 'email',
          'label': 'Email',
          'placeholder_text': 'Enter email here',
          'show_label': true,
          'required': true
        },
        {
          'name': 'phone',
          'type': 'text',
          'label': 'Phone',
          'placeholder_text': 'Enter phone here',
          'show_label': true,
          'required': false
        },
        {
          'name': 'message',
          'type': 'text',
          'label': 'Mesage',
          'placeholder_text': 'Enter message here',
          'show_label': true,
          'required': false
        }],
      }
    }
    }
  };
  public mediaCategories = [];
  public imgloading = false;
  currentPage = 1;
  constructor(
    @Inject(DOCUMENT) public _document: HTMLDocument,
    public apiService: ApiService,
    public userService: UserService,
    public campaignService: CampaignService,
    public modalService: BsModalService,
    public router: Router,
    public route: ActivatedRoute,
    private ngZone: NgZone,
    private fb: FormBuilder,
    private crmService: CrmService,
  ) {
    this.route.params.subscribe(params => {
      this.param_id = params.id;
    });

    this.modalForm = this.fb.group({
      'template_name': ['', [Validators.required]],
      'categories': [[], [Validators.required]],
      'design': [{}]
    });

    this.templateForm = this.fb.group({
      'template_id': ['', [Validators.required]],
      'campaign_id': ['', [Validators.required]],
      'template_name': ['', [Validators.required]],
      'template_values': ['', [Validators.required]]
    });
  }

  getMediaCategories() {
    this.userService.getMediaCategories().subscribe((response: any) => {
      this.mediaCategories = response.data || [];
    }, err => {
      this.userService.alerts.push({
        type: 'danger',
        msg: err.message,
        timeout: 4000
      });
    });
  }

  filterCategory() {
    this.ngZone.run(() => {
      this.parameters.pagination.offset = 0;
      this.imgloading = true;
      this.userService.getImages(this.parameters).subscribe((response: any) => {
        this.rows = response.data;
        this.counts = response.counts;
        this.page_no = 0;
        this.parameters.pagination.offset = 0;
        const number: any = Math.ceil(this.counts / this.parameters.pagination.limit);
        this.pages = Array.from(Array(number).keys());
        this.imgloading = false;
      }, err => {
        this.imgloading = false;
      });
    });
  }

  editorLoaded(event) {
    this.emailEditor.editor.setAppearance({
      theme: 'light',
      panels: {
        tools: {
          dock: 'left',
        }
      }
    });
    const design = this.campaignService.custom_values.design;
    this.emailEditor.editor.setMergeTags({
      business_name: {
        name: 'Business Name',
        value: '{{business_name}}',
        sample: this.details.business_details.business_name ? this.details.business_details.business_name : '--'
      },
      business_email: {
        name: 'Business Email',
        value: '{{business_email}}',
        sample: this.details.business_details.business_email ? this.details.business_details.business_email : '--'
      },
      business_phone: {
        name: 'Phone',
        value: '{{business_phone}}',
        sample: this.details.business_details.business_phone ? this.details.business_details.business_phone : '--'
      },
      business_website: {
        name: 'Website',
        value: '{{business_website}}',
        sample: this.details.business_details.business_website ? this.details.business_details.business_website : '--'
      },
      business_address: {
        name: 'Business Address',
        value: '{{business_address}}',
        sample: this.details.business_details.business_address ? this.details.business_details.business_address : '--'
      },
      business_file_name: {
        name: 'Logo',
        value: '{{business_file_name}}',
        sample: this.details.business_details.business_file_name ? '<img width="100" height="auto" src=' + this.details.business_details.business_file_name + '>' : '--'
      },
      call_tracking_number: {
        name: 'Tracking Number',
        value: '{{call_tracking_number}}',
        sample: this.details.call_tracking_details.tracking_number ? this.details.call_tracking_details.tracking_number : '--'
      }
    })
    this.emailEditor.loadDesign(design);
    this.emailEditor.editor.registerCallback('selectImage', (data, done) => {
      const self = this;
      this.modalRef = this.modalService.show(this.templateRef, {
        backdrop: true,
        ignoreBackdropClick: true,
        class: 'modal-xl'
      });
      // $(document).on('click', '#mediaLibrary img', function (e) {
      $('#mediaLibrary').on('click', 'img', function (e) {
        done({ url: $(e.target).attr('src') });
        self.modalRef.hide();
      });
    });
    this.emailEditor.editor.addEventListener('editor:ready', () => {
      this.emailEditor.editor.setBodyValues({
        contentWidth: '100%',
      });
    })
  }

  saveDesign(template: TemplateRef<any>) {
    this.emailEditor.editor.saveDesign((data) => {
      this.ngZone.run(() => {
        this.tagsListArray = [];
        this.modalRef = this.modalService.show(template, this.config);
        // this.modalForm.get('design').setValue(JSON.stringify({'design': data}));
        this.modalForm.patchValue({'design': JSON.stringify({'design': data}) });
      });
    });
  }

  submitForm() {
    this.isMaterTemplateSubmitting = true;
    const formData = this.modalForm.value;
    this.ngZone.run(() =>
    this.campaignService.saveAsMasterTemplate(formData).subscribe((response: any) => {
      this.isMaterTemplateSubmitting = false;
      this.userService.alerts.push({
        type: 'success',
        msg: response.message,
        timeout: 4000
      });
      this.modalForm.reset();
      this.hideModal();
    }, err => {
      this.isMaterTemplateSubmitting = false;
      this.userService.alerts.push({
        type: 'danger',
        msg: err.message,
        timeout: 4000
      });
      // this.hideModal();
    })
    )
  }

  saveAsTemplate(template: TemplateRef<any>) {
    this.emailEditor.editor.exportHtml((data) => {
      this.ngZone.run(() => {
        this.modalRef = this.modalService.show(template, this.config);
        this.templateForm.patchValue({'template_id': this.details.template_id});
        this.templateForm.patchValue({'campaign_id': this.param_id});
        this.templateForm.patchValue({'template_values': JSON.stringify({'design': data.design, 'html': data.html})
        });
      });
    });
  }

  templateFormSubmit() {
    this.isTemplateSubmitting = true;
    this.ngZone.run(() =>
      this.campaignService.saveAsTemplate(this.templateForm.value).subscribe((response: any) => {
        this.userService.alerts.push({
          type: 'success',
          msg: response.message,
          timeout: 4000
        });
        this.isTemplateSubmitting = false;
        this.hideModal();
      }, err => {
        this.userService.alerts.push({
          type: 'danger',
          msg: err.message,
          timeout: 4000
        });
        this.isTemplateSubmitting = false;
      })
    )
  }

  handlePageChange(event) {
    this.currentPage = event;
    this.imgloading = true;
    this.parameters.pagination.offset = (event - 1) * this.parameters.pagination.limit;
    this.imgloading = true;
    this.userService.getImages(this.parameters).subscribe((response: any) => {
      this.rows = response.data;
      this.counts = response.counts;
      this.imgloading = false;
    }, err => {
      this.imgloading = false;
    });
  }

  search(event) {
    if (this.parameters.keyword === '') {
      this.page_no = 0;
    }
    this.parameters.pagination.offset = 0;
    this.imgloading = true;
    this.userService.getImages(this.parameters).subscribe((response: any) => {
      this.rows = response.data;
      this.counts = response.counts;
      this.page_no = 0;
      this.parameters.pagination.offset = 0;
      const number: any = Math.ceil(this.counts / this.parameters.pagination.limit);
      this.pages = Array.from(Array(number).keys());
      this.imgloading = false;
    }, err => {
      this.imgloading = false;
      // console.log(err.message);
    });
  }
  onFileChanged(event) {
    if (event.target.files[0]) {
      this.isFileSubmitting = true;
      this.ngZone.run(() =>
      this.apiService.postMultiPart(event.target.files[0], 'image').subscribe(data => {
        const uploadedFiledata = data.data;
        // this.rows.unshift({
        //   'media_guid': uploadedFiledata.media_guid,
        //   'media_id': '',
        //   'name': uploadedFiledata.name,
        //   'original_name': uploadedFiledata.original_name,
        //   'media_category': 'OTHER',
        //   'status': uploadedFiledata.status,
        //   'extension': uploadedFiledata.extension,
        //   'image_url': uploadedFiledata.media_url,
        //   'created_at': uploadedFiledata.created_at
        // });
        this.userService.alerts.push({
          type: 'success',
          msg: data.message,
          timeout: 4000
        });
        this.isFileSubmitting = false;
        this.getImages();
      }, err => {
        this.userService.alerts.push({
          type: 'danger',
          msg: err.message,
          timeout: 4000
        });
        this.isFileSubmitting = false;
      })
      );
    }
  }

  getImages() {
    this.imgloading = true;
    this.userService.getImages(this.parameters).subscribe((response: any) => {
      this.rows = response.data;
      this.counts = response.counts;
      // FOR PAGINATION
      const number: any = Math.ceil(this.counts / this.parameters.pagination.limit);
      this.pages = Array.from(Array(number).keys());
      this.last_index = this.pages.length;
      // const element: HTMLElement = document.getElementById('img0') as HTMLElement;
      // element.click();
      this.imgloading = false;
    }, err => {
      this.userService.alerts.push({
        type: 'danger',
        msg: err.message,
        timeout: 4000
      });
      this.imgloading = false;
    });
  }
  ngOnInit(): void {
    this.getImages();
    this.getMediaCategories();
    const user = this.userService.getCurrentUser();
    const businessDetails = this.details.business_details;
    businessDetails.business_file_name = businessDetails.business_file_name ? '<img width="100" height="auto" src=' + businessDetails.business_file_name + '>' : '--'
    this.options = Object.assign(this.options, { designTags: businessDetails });
    this.options = Object.assign(this.options, { features: {stockImages: {enabled: true}}});
    this.userService.currentUser.subscribe(
      (userData) => {
      this.currentUser = userData;
    });
    this.userService.page_title = 'Template';
    if (Object.keys(this.details.template_values).length > 0) {
      const parseValues = JSON.parse(this.details.template_values);
      this.campaignService.custom_values = parseValues;
    } else if (Object.keys(this.details.default_values).length > 0) {
        this.campaignService.custom_values = this.details.default_values;
    } else {
      // console.log('last');
    }
    this.onFeatureChange();
    // this.getAllImages();
  }
  // getAllImages() {
  //   this.userService.getAllImages({}).subscribe((response: any) => {
  //     this.imageList = response.data || [];
  //     this.imageList.forEach(image => {
  //       if (image.image_url) {
  //         this._editor.AssetManager.add(image.image_url);
  //       }
  //     });
  //   }, err => {
  //     this.userService.alerts.push({
  //       type: 'danger',
  //       msg: err.message,
  //       timeout: 4000
  //     });
  //   });
  // }

  // private initializeEditor(): any {
  //   return grapesjs.init({
  //     container: '#gjs',
  //     // autorender: true,
  //     // autorender: true,
  //     forceClass: false,
  //     autosave: false,
  //     // components: '',
  //     // style: '',
  //     // plugins: ['gjs-preset-webpage', gjsForms],
  //     plugins: ['gjs-preset-webpage', 'gjs-blocks-basic'],
  //     // plugins: ['gjs-preset-webpage'],
  //     // plugins: ['grapesjs-preset-newsletter'],
  //     pluginsOpts: {
  //       'gjs-preset-webpage': {
  //         navbarOpts: false,
  //         countdownOpts: false,
  //         formsOpts: false,
  //         blocksBasicOpts: {
  //           blocks: ['link-block', 'quote', 'image', 'video', 'text', 'column1', 'column2', 'column3' ],
  //           flexGrid: true,
  //           stylePrefix: 'lala-'
  //         }
  //       }
  //     },
  //     assetManager: {
  //       uploadText: 'Add image through link or upload image',
  //       modalTitle: 'Select Image',
  //       openAssetsOnDrop: 1,
  //       addBtnText: 'Add image',
  //       uploadFile: (e) => {
  //         const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
  //         const selectedFile = e.target.files[0];
  //       if (selectedFile) {
  //         this.uploadImage(selectedFile);
  //       }
  //       },
  //       handleAdd: (textFromInput) => {
  //         this.editor.AssetManager.add(textFromInput);
  //       }
  //     },
  //     storageManager: {
  //       type: 'remote',
  //       stepsBeforeSave: 1,
  //       credentials: 'omit',         // Store data automatically
  //       autoload: true,
  //       autosave: true,
  //       // storeStyles: true,
  //       // storeHtml: true,
  //       // storeCss: true,
  //       urlStore: environment.site_addr + '/site/save_landing_page/' + this.param_id,
  //       urlLoad: environment.site_addr + '/site/save_details_landing_page/' + this.param_id,

  //     },
  //     canvas: {
  //       styles: [
  //         'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
  //         'https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css'
  //       ],
  //       scripts: ['https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js']
  //     },
  //     domComponents: {},
  //     richTextEditor: {}
  //   });
  // }


  // private initializeEditor(): any {
  //   return grapesjs.init({
  //     container: '#gjs',
  //     autorender: true,
  //     forceClass: false,
  //     autosave: false,
  //     components: '',
  //     style: '',
  //     plugins: ['gjs-preset-webpage'],
  //     // plugins: ['gjs-preset-webpage', gjsForms],

  //     pluginsOpts: {
  //       'gjs-preset-webpage': {
  //         navbarOpts: false,
  //         countdownOpts: false,
  //         formsOpts: false,
  //         blocksBasicOpts: {
  //           blocks: ['link-block', 'quote', 'image', 'video', 'text', 'column1', 'column2', 'column3'],
  //           flexGrid: false,
  //           stylePrefix: 'lala-'
  //         }
  //       }
  //     },
  //     assetManager: {
  //       uploadText: 'Add image through link or upload image',
  //       modalTitle: 'Select Image',
  //       openAssetsOnDrop: 1,
  //       // inputPlaceholder: 'http://url/to/the/image.jpg',
  //       addBtnText: 'Add image',
  //       uploadFile: (e) => {
  //         const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
  //         const selectedFile = e.target.files[0];
  //       if (selectedFile) {
  //         this.uploadImage(selectedFile);
  //       }
  //       },
  //       handleAdd: (textFromInput) => {
  //         this.editor.AssetManager.add(textFromInput);
  //       }
  //     },
  //     storageManager: {
  //       type: 'remote',
  //       stepsBeforeSave: 1,
  //       credentials: 'omit',         // Store data automatically
  //       autoload: true,
  //       autosave: true,
  //       // urlStore: 'http://localhost/tikisites/site/save_landing_page/' + this.param_id,
  //       // urlLoad: 'http://localhost/tikisites/site/save_details_landing_page/' + this.param_id,
  //       urlStore: environment.site_addr + '/site/save_landing_page/' + this.param_id,
  //       urlLoad: environment.site_addr + '/site/save_details_landing_page/' + this.param_id,
  //       // params: { page_id: this.param_id },
  //       // contentTypeJson: true,
  //       // storeComponents: true,
  //       // storeStyles: true,
  //       // storeHtml: true,
  //       // storeCss: true,
  //       //  headers: {
  //       // 'Content-Type': 'application/json'
  //       // }
  //     },

  //     // storageManager: {
  //     //   type: 'remote',
  //     //   credentials: 'omit',
  //     //   autoload: true,
  //     //   stepsBeforeSave: 1,
  //     //   contentTypeJson: true,
  //     //   urlStore: 'http://localhost/tikisites/site/save_landing_page?id=gjs',
  //     //   urlLoad: 'http://localhost/tikisites/site/save_details_landing_page?id=gjs',
  //     //   params: {},   // For custom values on requests
  //     // },

  //     // storageManager: {
  //     //   type: 'remote',
  //     //   stepsBeforeSave: 1,
  //     //   storeComponents: false,
  //     //   storeStyles: false,
  //     //   storeHtml: true,
  //     //   storeCss: true,
  //     //   urlStore: 'http://localhost/tikisites/site/save_landing_page?id=gjs',
  //     //   urlLoad: 'http://localhost/tikisites/site/save_details_landing_page?id=gjs',
  //     //   params: {},   // For custom values on requests
  //     // }
  //     // storageManager: {
  //     //   id: 'gjs',
  //     //   autosave: true,         // Store data automatically
  //     //   type: 'remote',
  //     //   stepsBeforeSave: 3,
  //     //   urlStore: 'http://localhost/tikisites/site/save_landing_page?id=gjs',
  //     //   urlLoad: 'http://localhost/tikisites/site/save_details_landing_page?id=gjs',
  //     //   credentials: 'omit',

  //     //   // http://localhost/tikisites/api/save_landing_page
  //     //   // For custom parameters/headers on requests
  //     //   params: { campaign_id: '123' },
  //     //   headers: {
  //     //     'session-key': 'ccf2499c-d795-d581-e99f-3ab93d536ac4',
  //     //     // 'Access-Control-Allow-Origin': '*'
  //     //   }
  //     // },
  //     // storageManager: {
  //     //   type: 'remote',
  //     //   stepsBeforeSave: 10,
  //     //   urlStore: 'http://localhost/tikisites/landingpage/testl',
  //     //   urlLoad: 'http://localhost/tikisites/landingpage/save_landing_page',
  //     //   params: {
  //     //   'Access-Control-Allow-Origin':'http://laravel-vue-spa.test',
  //     //   },
  //     //   contentTypeJson: true,
  //     //   headers: {
  //     //   'Content-Type': 'application/json'
  //     //   },
  //     //   json_encode: {
  //     //   'gjs-components': [],
  //     //   'gjs-style': [],
  //     //   'gjs-html': '',
  //     //   }
  //     //   },
  //     // storageManager: {
  //     //   type: 'remote',
  //     //   stepsBeforeSave: 1,
  //     //   autosave: true,         // http://localhost/tikisites Store data automatically
  //     //   autoload: true,
  //     //   urlStore: 'http://localhost/tikisites/landingpage/testl/1',
  //     //   urlLoad: 'http://localhost/tikisites/landingpage/test/1',
  //     //   // params: { page_id: 11111 },
  //     //   contentTypeJson: true,
  //     //   storeComponents: true,
  //     //   storeStyles: true,
  //     //   storeHtml: true,
  //     //   storeCss: true,
  //     //   headers: {
  //     //     'Content-Type': 'application-json',
  //     //     'Accept': 'application-json',
  //     //     'session-key': 'ccf2499c-d795-d581-e99f-3ab93d536ac4'
  //     //   }
  //     // },
  //     canvas: {
  //       styles: [
  //         'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css',
  //         'https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css'
  //       ],
  //       scripts: ['https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js']
  //     }
  //   });
  // }


  get editor() {
    return this._editor;
  }

  // updateGrapesjsData() {
  //   this._editor.store();
  //   this._editor.load();
  // }

  // uploadImage(file) {
  //   this.apiService.postMultiPart(file, 'image').subscribe(responce => {
  //     // console.log(responce.data.media_url);
  //     // this._editor.assetManager.add('http://localhost/tikisites/uploads/ca47027b-c915-6c6d-d18f-bc3eb180af53.jpg');
  //     this._editor.AssetManager.add(responce.data.media_url);
  //   }, err => {
  //     this.alerts.push({
  //       type: 'danger',
  //       msg: err.message,
  //       timeout: 4000
  //     });
  //   });
  // }
  onFeatureChange() {
    const cr_index = this.campaignService.campaign_tabs.findIndex(p => p.value === 'create');
    this.campaignService.campaign_tabs[cr_index].is_tab = true;
    this.campaignService.campaign_tabs[cr_index].active = false;
    this.campaignService.campaign_tabs[cr_index].url = '/user/campaigns/' + this.param_id + '/edit';

    if (this.details.is_landing_page === 'YES') {
      const lp_index = this.campaignService.campaign_tabs.findIndex(p => p.value === 'landingpage');
      this.campaignService.campaign_tabs[lp_index].is_tab = true;
      this.campaignService.campaign_tabs[lp_index].active = true;
      if (this.details.is_landing_page && !this.details.template_values) {
        this.campaignService.campaign_tabs[lp_index].url = '/user/campaigns/' + this.param_id + '/templates';
      } else if (this.details.is_landing_page && this.details.template_values) {
        this.campaignService.campaign_tabs[lp_index].url = '/user/campaigns/' + this.param_id + '/design';
      }
    } else {
      const lp_index = this.campaignService.campaign_tabs.findIndex(p => p.value === 'landingpage');
      this.campaignService.campaign_tabs[lp_index].is_tab = false;
      this.campaignService.campaign_tabs[lp_index].active = false;
      this.campaignService.campaign_tabs[lp_index].url = '';
    }
    if (this.details.is_call_tracking_number === 'YES') {
      const ct_index = this.campaignService.campaign_tabs.findIndex(p => p.value === 'calltracking');
      this.campaignService.campaign_tabs[ct_index].is_tab = true;
      this.campaignService.campaign_tabs[ct_index].active = false;
      this.campaignService.campaign_tabs[ct_index].url = '/user/campaigns/' + this.param_id + '/call-tracking-number';
    } else {
      const ct_index = this.campaignService.campaign_tabs.findIndex(p => p.value === 'calltracking');
      this.campaignService.campaign_tabs[ct_index].is_tab = false;
      this.campaignService.campaign_tabs[ct_index].active = false;
      this.campaignService.campaign_tabs[ct_index].url = '';
    }
    if (this.details.is_qr_code === 'YES') {
      const qr_index = this.campaignService.campaign_tabs.findIndex(p => p.value === 'qrcode');
      this.campaignService.campaign_tabs[qr_index].is_tab = true;
      this.campaignService.campaign_tabs[qr_index].active = false;
      this.campaignService.campaign_tabs[qr_index].url = '/user/campaigns/' + this.param_id + '/qr-code';
    } else {
      const qr_index = this.campaignService.campaign_tabs.findIndex(p => p.value === 'qrcode');
      this.campaignService.campaign_tabs[qr_index].is_tab = false;
      this.campaignService.campaign_tabs[qr_index].active = false;
      this.campaignService.campaign_tabs[qr_index].url = '';
    }
    if (this.details.is_email_marketing === 'YES') {
      const em_index = this.campaignService.campaign_tabs.findIndex(p => p.value === 'emailmarketing');
      this.campaignService.campaign_tabs[em_index].is_tab = true;
      this.campaignService.campaign_tabs[em_index].active = false;
      if (this.details.is_email_marketing && !this.details.email_template_values) {
        this.campaignService.campaign_tabs[em_index].url = '/user/campaigns/' + this.param_id + '/email-templates';
      } else if (this.details.is_email_marketing && this.details.email_template_values) {
        this.campaignService.campaign_tabs[em_index].url = '/user/campaigns/' + this.param_id + '/email-design';
      }
    } else {
      const em_index = this.campaignService.campaign_tabs.findIndex(p => p.value === 'emailmarketing');
      this.campaignService.campaign_tabs[em_index].is_tab = false;
      this.campaignService.campaign_tabs[em_index].active = false;
      this.campaignService.campaign_tabs[em_index].url = '';
    }
    this.getTabsLength();
  }

  getTabsLength() {
    const tabs_array = [];
    this.campaignService.campaign_tabs.forEach((tab) => {
      if (tab.is_tab) {
        tabs_array.push(tab);
      }
    });
    if (tabs_array.length === 1) {
      this.tabs_css = 1;
      return 1;
    }
    if (tabs_array.length === 2) {
      this.tabs_css = 2;
      return 2;
    }
    if (tabs_array.length === 3) {
      this.tabs_css = 3;
      return 3;
    }
    if (tabs_array.length === 4) {
      this.tabs_css = 4;
      return 4;
    }
    this.tabs_css = 5;
    return 5;
  }

  // template_values: JSON.stringify(this.campaignService.custom_values)
  updateTemplateDetails(type) {
    this.isSaveNext = type;
    this.isSubmitting = true;
    let jsonData: any = {};
    // this.updateGrapesjsData();
    // this.previewTemplate('view');
    if (Object.keys(jsonData).length === 0 ) {
        this.emailEditor.editor.exportHtml((data) => {
          jsonData =  {
            campaign_id: this.param_id,
            template_values: JSON.stringify({'design': data.design, 'html': data.html})
          };
          this.proceedToSave(jsonData);
        })
    } else {
      const json = {
        campaign_id: this.param_id,
        template_values: JSON.stringify(jsonData)
      };
      this.proceedToSave(json);
    }
  }

  proceedToSave(templateData: any = {}) {
    const classObject = this;
      this.ngZone.run(() => {
        templateData.is_custom_landing = 'YES';
        this.campaignService.updateTemplateDetails(templateData).subscribe((response: any) => {
          // this.userService.alerts.push({
          //   type: 'success',
          //   msg: response.message,
          //   timeout: 4000
          // });
          //  this.createUnlayerThumbanail(templateData);
          this.isSubmitting = false;
          if (this.isSaveNext === 'YES') {
            this.ngZone.run(() => this.router.navigate(['/user/campaigns/', this.param_id, 'setting']));
          }
      });
    },
      err => {
        this.userService.alerts.push({
          type: 'danger',
          msg: err.message,
          timeout: 4000
        });
        this.isSubmitting = false;
      });
  }

  // createUnlayerThumbanail(templateData) {
  //   this.campaignService.createUnlayerThumbanail(templateData).subscribe((response: any) => {
  //     // this.userService.alerts.push({
  //     //   type: 'success',
  //     //   msg: response.message,
  //     //   timeout: 4000
  //     // });
  //     this.isSubmitting = false;
  //     if (this.isSaveNext === 'YES') {
  //       this.ngZone.run(() => this.router.navigate(['/user/campaigns/', this.param_id, 'setting']));
  //     }
  //   }, err => {
  //       this.userService.alerts.push({
  //         type: 'danger',
  //         msg: err.message,
  //         timeout: 4000
  //       });
  //       this.isSubmitting = false;
  //     });
  // }

  uploadimage(image) {
    this.isSubmitting = false;
    if (image) {
      const stringLength = image.length - '/^data:image\/[a-z]+;base64,/'.length;
      const file_size_in_kb_bytes = 4 * Math.ceil((stringLength / 3)) * 0.5624896334383812;
      const file_size_in_kb = file_size_in_kb_bytes / 1000;
      const cropped_image = image.replace(/^data:image\/[a-z]+;base64,/, '');

      const image_data = {
        type_id: this.param_id,
        image_crop: cropped_image,
        file_size: file_size_in_kb,
        type: 'image',
        original_name: 'base_template.jpg',
        image_type: 'preview_tempate'
      }
      this.campaignService.postBaseImage(image_data).subscribe(data => {
        // this.userService.alerts.push({
        //   type: 'success',
        //   msg: data.message,
        //   timeout: 4000
        // });
      this.isSubmitting = false;
      this.router.navigate(['/user/campaigns/', this.param_id, 'setting']);
        // tslint:disable-next-line:no-unused-expression
      }), err => {
        this.isSubmitting = true;
        this.userService.alerts.push({
          type: 'danger',
          msg: err.message,
          timeout: 4000
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.userService.alerts = [];
  }

  previewTemplate(type) {
    this.emailEditor.editor.showPreview('desktop');
    /* this.mode = type;
    const cm = this._editor.Commands;
    if (type === 'view') {
      cm.run('preview');
    } else {
      cm.stop('preview');
    } */
  }

  hideModal(): void {
    this.modalRef.hide();
  }

  addTag(name) {
    return { name: name, tag: true };
  }

  onChange(e) {
    this.crmService.autoSuggestions({
      user_id: this.currentUser.user_guid,
      entity_guid: '',
      entity_type: '',
      keyword: e.key,
      type: 'master_tag'
    }).subscribe(data => {
      this.tagsListArray = [];
      let uniqueArray = [];
      data.forEach((c, i) => {
        if (this.tagsListArray.indexOf(c) < 0) {
          uniqueArray = [...uniqueArray, c];
        }
      });
      this.tagsListArray = uniqueArray;
    }, err => {
      // console.log(err.message);
    })
  }
}

