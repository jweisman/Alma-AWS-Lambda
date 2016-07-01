package com.exlibrisgroup.alma;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Path;

import com.yeokhengmeng.docstopdfconverter.*;

// Adapted from:
// https://github.com/yeokm1/docs-to-pdf-converter/blob/master/docs-to-pdf-converter/src/com/yeokhengmeng/docstopdfconverter/MainClass.java
public class DocsToPdfConverter{

	public static File Convert(File inFile, Path outFilePath) throws Exception {
		Converter converter = null;
		File outFile = null;
		try {

			boolean shouldShowMessages = false;
			outFile = new File(changeExtensionToPDF(inFile.toString()));

			String lowerCaseInPath = inFile.toString().toLowerCase();
			
			InputStream inStream = getInFileStream(inFile);
			OutputStream outStream = getOutFileStream(outFile);
			
			if(lowerCaseInPath.endsWith("doc")){
				converter = new DocToPDFConverter(inStream, outStream, shouldShowMessages, true);
			} else if (lowerCaseInPath.endsWith("docx")){
				converter = new DocxToPDFConverter(inStream, outStream, shouldShowMessages, true);
			} else if(lowerCaseInPath.endsWith("ppt")){
				converter = new PptToPDFConverter(inStream, outStream, shouldShowMessages, true);
			} else if(lowerCaseInPath.endsWith("pptx")){
				converter = new PptxToPDFConverter(inStream, outStream, shouldShowMessages, true);
			} else if(lowerCaseInPath.endsWith("odt")){
				converter = new OdtToPDF(inStream, outStream, shouldShowMessages, true);
			} else {
				converter = null;
			}

			converter.convert();
				
		} catch (Exception e) {
			System.err.println(e.getMessage());
			throw e;
		}

		return outFile;
	}

	//From http://stackoverflow.com/questions/941272/how-do-i-trim-a-file-extension-from-a-string-in-java
	public static String changeExtensionToPDF(String originalPath) {

		String filename = originalPath;

		// Remove the extension.
		int extensionIndex = filename.lastIndexOf(".");

		String removedExtension;
		if (extensionIndex == -1){
			removedExtension =  filename;
		} else {
			removedExtension =  filename.substring(0, extensionIndex);
		}
		String addPDFExtension = removedExtension + ".pdf";

		return addPDFExtension;
	}
	
	
	protected static InputStream getInFileStream(File inFile) throws FileNotFoundException{
		FileInputStream iStream = new FileInputStream(inFile);
		return iStream;
	}
	
	protected static OutputStream getOutFileStream(File outFile) throws IOException{		
		try{
			//Make all directories up to specified
			outFile.getParentFile().mkdirs();
		} catch (NullPointerException e){
			//Ignore error since it means not parent directories
		}
		
		outFile.createNewFile();
		FileOutputStream oStream = new FileOutputStream(outFile);
		return oStream;
	}

}
