package jy.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jy.demo.api.DalaiClient;

@Service
public class DalaiServiceImpl {

	private final DalaiClient dalaiClient;

	@Autowired
	public DalaiServiceImpl(DalaiClient dalaiClient) {
		this.dalaiClient = dalaiClient;
	}

	public String sendRequest(String prompt) {
		return dalaiClient.sendPrompt(prompt);
	}
}
