// AttachmentUploaderController.cls
public with sharing class AttachmentUploaderController {
    @AuraEnabled(cacheable=false)
    public static void uploadFiles(String base64Data, String fileName, Id parentId, String status) {
        try {
            // Get file extension
            System.debug('FileName-->' + fileName);
            String[] fileNameParts = fileName.split('\\.');
            String fileExtension = fileNameParts.size() > 1 ? '.' + fileNameParts[fileNameParts.size()-1] : '';

            // Insert ContentVersion
            ContentVersion cv = new ContentVersion(
                VersionData = EncodingUtil.base64Decode(base64Data),
                Title = status,
                PathOnClient = status + fileExtension); // Include file extension            );
            insert cv;

            // Query ContentDocumentId
            Id contentDocumentId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id].ContentDocumentId;

            // Insert ContentDocumentLink
            ContentDocumentLink cdl = new ContentDocumentLink(
                ContentDocumentId = contentDocumentId,
                LinkedEntityId = parentId,
                ShareType = 'V',
                Visibility = 'AllUsers'
            );
            insert cdl;

        } catch (Exception e) {
            throw new AuraHandledException('Error uploading file: ' + e.getMessage());
        }
    }
}
