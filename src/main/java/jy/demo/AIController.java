package jy.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.Map;

@RestController
public class AIController {

	private final ChatGPTClient chatGPTClient;

	public AIController(ChatGPTClient chatGPTClient) {
		this.chatGPTClient = chatGPTClient;
	}

	private final String SYS_PROMPT =  
		"You are a developer with excellent Java and JavaScript development skills. \n" + 
		"Please regenerate the code by refactoring the given source. \n" + 
		"Please write the regenerated code in the output area below. \n" + 
		"output :  \n" + 
		" \n" + 
		"input : \n";


	@GetMapping("/refactoring")
	public String doRefactoring(@RequestParam("prompt") String prompt) {
		return chatGPTClient.sendRequest(prompt, SYS_PROMPT);
	}

	@PostMapping("/refactoring")
	public String doRefactoring(@RequestBody Map<String, String> prompt) {
		return chatGPTClient.sendRequest(prompt.get("prompt"), SYS_PROMPT);
	}
}