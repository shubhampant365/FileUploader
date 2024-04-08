import { LightningElement, api, wire,track } from 'lwc';
import fetchWorkOrderDetails from '@salesforce/apex/RMAController.fetchWorkOrderDetails';
import createPRARecord from '@salesforce/apex/RMAController.createPRARecord';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class PRAForm extends LightningElement {
    @api recordId;
    @track assetId;
    @track assetName;
    @track productName;
    @track contactId;
    @track contactName;
    @track product2Id;
    @track reason = '';
    @track files = [];
    connectedCallback() {
        this.loadWorkOrderDetails();
    }

    loadWorkOrderDetails() {
        fetchWorkOrderDetails({ workOrderId: this.recordId })
            .then(result => {
                this.assetId = result.AssetId;
                this.assetName = result.Asset.Name;
                this.productName = result.Asset.Product2.Name;
                this.product2Id = result.Asset.Product2Id;
                this.contactId = result.ContactId;
                this.contactName = result.Contact.Name;
            })
            .catch(error => {
                console.error('Error loading WorkOrder details', error);
            });
    }

    handleFileChange(event) {
        this.files = event.target.files; // Store the selected files
    }

    handleReasonChange(event) {
        this.reason = event.target.value;
    }

    async handleSave() {
        // Validate if Reason field is empty
        if (!this.reason) {
            this.showToast('Error', 'Please enter a reason', 'error');
            return;
        }
    
        // Prepare data for PRA creation
        const praData = {
            workOrderId: this.recordId,
            assetId: this.assetId,
            productId: this.product2Id,
            contactId: this.contactId,
            reason: this.reason
            // Add additional fields as needed
        };
    
        // Call Apex method to create PRA record
        try {
            let fileContent;
            let fileName;
            if (this.files && this.files.length > 0) {
                const fileData = this.files[0];
                fileContent = await this.readFileAsync(fileData); // Read file content asynchronously
                fileName = fileData.name;
            }
            await createPRARecord({ praData: praData, fileBody: fileContent, fileName: fileName });
            // Success message or further actions after record creation
            console.log('PRA record created successfully.');
    
            // Show success toast notification
            this.showToast('Success', 'PRA record created successfully', 'success');
        } catch (error) {
            console.error('Error creating PRA record: ', error);
            // Handle error
    
            // Show error toast notification
            this.showToast('Error', 'Error creating PRA record', 'error');
        }
    }

    // Asynchronous function to read file content
    readFileAsync(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const fileContent = reader.result.split(',')[1]; // Exclude data URL prefix
                resolve(fileContent);
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    // Method to display toast message
    showToast(title, message, variant) {
        const event = new ShowToastEvent({
            title: title,
            message: message,
            variant: variant
        });
        this.dispatchEvent(event);
    }
}
