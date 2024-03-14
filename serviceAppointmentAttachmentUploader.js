// serviceAppointmentAttachmentUploader.js
import { LightningElement, track, wire, api } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import uploadFiles from '@salesforce/apex/AttachmentUploaderController.uploadFiles';
import SERVICE_APPOINTMENT_OBJECT from '@salesforce/schema/ServiceAppointment';
import STATUS_FIELD from '@salesforce/schema/ServiceAppointment.Status';

export default class ServiceAppointmentAttachmentUploader extends LightningElement {
    @track selectedStatus = '';
    @track statusOptions = [];
    @api recordId;
    file;

    @wire(getObjectInfo, { objectApiName: SERVICE_APPOINTMENT_OBJECT })
    objectInfo;

    @wire(getPicklistValues, {
        recordTypeId: '$objectInfo.data.defaultRecordTypeId',
        fieldApiName: STATUS_FIELD
    })
    wiredPicklistValues({ error, data }) {
        if (data) {
            this.statusOptions = data.values.map(item => ({
                label: item.label,
                value: item.value
            }));
        } else if (error) {
            // Handle error
            this.showToast('Error', 'Failed to retrieve picklist values', 'error');
            console.error('Error fetching picklist values:', error);
        }
    }

    handleStatusChange(event) {
        this.selectedStatus = event.detail.value;
    }

    handleFileChange(event) {
        this.file = event.target.files[0];
        this.uploadFile();
    }

    async uploadFile() {
        if (!this.file) {
            this.showToast('Error', 'Please select a file to upload', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
            const fileContents = reader.result;
            const base64 = fileContents.match(/^data:(.*);base64,(.*)$/)[2];
            try {
                await uploadFiles({ base64Data: base64, fileName: this.file.name, parentId: this.recordId, status: this.selectedStatus });
                this.showToast('Success', 'File uploaded successfully', 'success');
                // You can reset the selected status or any other cleanup here
            } catch (error) {
                console.error('Error uploading file:', error);
                this.showToast('Error', 'An error occurred while uploading the file', 'error');
            }
        };
        reader.readAsDataURL(this.file);
    }

    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
}
