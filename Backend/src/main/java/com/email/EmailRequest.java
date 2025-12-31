package com.email.email;

import lombok.Data;

@Data
public class EmailRequest {
	
	private String emailContent;
	public String getEmailContent() {
		return emailContent;
	}
	
	private String tone;
	public String getTone() {
		return tone;
	}

}
