package com.exlibrisgroup.alma;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.RequestHandler;

public class PdfConverter implements RequestHandler<PdfConverter.PdfRequest, PdfConverter.PdfResponse> {

	public static class PdfRequest {
		String bucket;
		String key;
		String destination;
		
		public String getBucket() {
			return bucket;
		}
		
		public void setBucket(String bucket) {
			this.bucket = bucket;
		}
		
		public String getKey() {
			return key;
		}
		
		public void setKey(String key) {
			this.key = key;
		}
		
		public String getDestination() {
			return this.destination;
		}
		
		public void setDestination(String destination) {
			this.destination = destination;
		}
		
		public PdfRequest(String bucket, String key) {
			this.bucket = bucket;
			this.key = key;
			this.destination = Utilities.pathFromKey(key);
		}
		
		public PdfRequest(String bucket, String key, String destination) {
			this.bucket = bucket;
			this.key = key;
			this.destination = destination;
		}
		
		public PdfRequest() {
			
		}
	}
	
	public static class PdfResponse {
		String bucket;
		String key;
		
		public String getBucket() {
			return bucket;
		}
		
		public void setBucket(String bucket) {
			this.bucket = bucket;
		}
		
		public String getKey() {
			return key;
		}
		
		public void setKey(String key) {
			this.key = key;
		}
				
		public PdfResponse(String bucket, String key) {
			this.bucket = bucket;
			this.key = key;
		}
		
		public PdfResponse() {
			
		}
	}
	
    public PdfResponse handleRequest(PdfRequest request, Context context)
    {
    	LambdaLogger logger = context.getLogger();
    	logger.log("Request to convert " + request.key + " and save to " + request.destination);
    	
    	Path dir = null;
    	File pdf = null;
    	try {
    		dir = Files.createTempDirectory(getClass().getName());
        	File file = Utilities.downloadFileFromS3(request.bucket, request.key, dir);
        	pdf = DocsToPdfConverter.Convert(file, dir);
        	Utilities.writeFileToS3(request.bucket, 
        			request.destination + pdf.getName(), 
        			pdf
        			);
		} catch (Exception e) {
			e.printStackTrace();
			throw new RuntimeException(e.getMessage());
		}

    	logger.log("Saving " + request.destination + pdf.getName());
        return new PdfResponse(request.bucket, request.destination + pdf.getName());
	}
}

