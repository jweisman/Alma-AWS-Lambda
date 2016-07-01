package com.exlibrisgroup.alma;

import java.io.IOException;

import org.junit.BeforeClass;
import org.junit.Test;

import com.amazonaws.services.lambda.runtime.Context;
import com.exlibrisgroup.alma.PdfConverter.PdfRequest;

/**
 * A simple test harness for locally invoking your Lambda function handler.
 */
public class PdfConverterTest {

    private static PdfConverter.PdfRequest input;

    @BeforeClass
    public static void createInput() throws IOException {
        // TODO: set up your sample input object here.
        input = null;
    }

    private Context createContext() {
        TestContext ctx = new TestContext();

        // TODO: customize your context here if needed.
        ctx.setFunctionName("Your Function Name");

        return ctx;
    }

    @Test
    public void testPdfConverter() {
        PdfConverter handler = new PdfConverter();
        input = new PdfRequest("exl-dev-scratch", "pdf/Ingesting Digital Content at Scale.docx");
        //input = new PdfRequest("exl-dev-scratch", "RAG 2016-Ingesting Digital Content at Scale.pptx");
        
        Context ctx = createContext();

        Object output = handler.handleRequest(input, ctx);

        // TODO: validate output here if needed.
        if (output != null) {
            System.out.println(output.toString());
        }
    }
}
