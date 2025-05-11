package tn.sousse.univ.reservation_app;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
//import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
//import org.springframework.data.mongodb.repository.config.EnableReactiveMongoRepositories;

import jakarta.annotation.PostConstruct;

@SpringBootApplication(scanBasePackages = "tn.sousse.univ.reservation_app")
// @EnableMongoRepositories("tn.sousse.univ.reservation_app.repositories")
// @EnableReactiveMongoRepositories("tn.sousse.univ.reservation_app.repositories")
public class ReservationAppApplication {

	@PostConstruct
	void init() {
		TimeZone.setDefault(TimeZone.getTimeZone("Africa/Tunis"));
	}

	public static void main(String[] args) {

		SpringApplication.run(ReservationAppApplication.class, args);
	}

}
