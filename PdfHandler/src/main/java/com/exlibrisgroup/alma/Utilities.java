package com.exlibrisgroup.alma;

import java.io.File;
import java.nio.file.Path;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.model.GetObjectRequest;
import com.amazonaws.services.s3.model.PutObjectRequest;

public class Utilities {
	
	public static String pathFromKey(String key) {
    	if (key.indexOf("/") >= 0)
    		return key.substring(0, key.lastIndexOf("/")+1);
    	else
    		return "";
	}
	
	public static String fileNameFromKey(String key) {
    	if (key.indexOf("/") >= 0)
    		return key.substring(key.lastIndexOf("/")+1);
    	else
    		return key;
	}
	
    public static void writeFileToS3(String bucket, String key, File file) {
        AmazonS3 s3 = new AmazonS3Client();
    	//s3.setRegion(_properties.getRegion());
    	String bucketName = bucket;
    	//String prefix = "" + _props.getProperty("prefix");
    	//String key = prefix + folder + "/" + path.getFileName();
    	s3.putObject(new PutObjectRequest(bucketName, key, file));    	
    }
    
    public static File downloadFileFromS3(String bucket, String key, Path path) {
    	AmazonS3 s3 = new AmazonS3Client();
    	String filename = fileNameFromKey(key);
    	
    	File file = new File(path.toFile(), filename);
    	s3.getObject(
    			new GetObjectRequest(bucket, key),
    			file
    	);
    	return file;
    }

}
